/**
 * Retry Executor
 * Main orchestrator for retry logic, circuit breaker, and monitoring
 */

import {
  RetryConfig,
  RetryMetrics,
  RetryableError,
  CircuitBreakerState,
  RETRY_CONFIGS,
} from './types'

// Re-export for convenience
export { RETRY_CONFIGS }
import {
  calculateDelay,
  shouldRetry,
  validateRetryConfig,
  getErrorMessage,
} from './policy'
import {
  getOrCreateCircuitBreaker,
  CircuitBreaker,
} from './circuit-breaker'

/**
 * Metrics collector callback
 */
export type MetricsCallback = (metrics: RetryMetrics) => void

/**
 * Retry executor with circuit breaker and monitoring
 */
export class RetryExecutor {
  private circuitBreaker: CircuitBreaker
  private metrics: RetryMetrics[] = []
  private metricsCallback?: MetricsCallback

  constructor(
    private operationName: string,
    private config: RetryConfig,
    metricsCallback?: MetricsCallback,
  ) {
    // Validate configuration
    validateRetryConfig(config)

    // Initialize circuit breaker
    this.circuitBreaker = getOrCreateCircuitBreaker(operationName, config)
    this.metricsCallback = metricsCallback
  }

  /**
   * Execute a function with retry logic and circuit breaker
   * @param fn - Async function to execute
   * @returns Result of function or throws error
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now()
    let lastError: unknown

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Check circuit breaker state
        this.circuitBreaker.checkState()

        // Execute the function with timeout
        const result = await this.executeWithTimeout(fn)

        // Record success
        this.circuitBreaker.recordSuccess()
        this.recordMetrics(attempt, 0, true, undefined)

        return result
      } catch (error) {
        lastError = error

        // Check if this error is a circuit breaker issue
        if (error instanceof Error && error.name === 'CircuitBreakerOpenError') {
          this.recordMetrics(attempt, 0, false, getErrorMessage(error))
          throw error
        }

        // Check if we should retry
        if (!shouldRetry(error, attempt, this.config)) {
          this.circuitBreaker.recordFailure()
          this.recordMetrics(attempt, 0, false, getErrorMessage(error))
          throw new RetryableError(
            `${this.operationName} failed after ${attempt + 1} attempt(s): ${getErrorMessage(error)}`,
            error,
            attempt + 1,
            this.config.maxRetries,
          )
        }

        // Don't record circuit breaker failure yet for retriable errors
        if (attempt === this.config.maxRetries) {
          // Last attempt - record failure
          this.circuitBreaker.recordFailure()
        }

        // Calculate delay for next retry
        if (attempt < this.config.maxRetries) {
          const delayMs = calculateDelay(
            this.config.strategy,
            attempt,
            this.config.baseDelayMs,
            this.config.maxDelayMs,
            this.config.jitter,
          )

          console.log(
            `[Retry] ${this.operationName}: Attempt ${attempt + 1}/${this.config.maxRetries + 1} failed. Retrying in ${delayMs}ms...`,
            getErrorMessage(error),
          )

          this.recordMetrics(attempt, delayMs, false, getErrorMessage(error))

          // Wait before retrying
          await this.sleep(delayMs)
        } else {
          // Last attempt failed
          this.recordMetrics(attempt, 0, false, getErrorMessage(error))
        }
      }
    }

    // All retries exhausted
    throw new RetryableError(
      `${this.operationName} failed after ${this.config.maxRetries + 1} attempt(s): ${getErrorMessage(lastError)}`,
      lastError,
      this.config.maxRetries + 1,
      this.config.maxRetries,
    )
  }

  /**
   * Execute function with timeout
   * @param fn - Function to execute
   * @returns Result or throws timeout error
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      this.createTimeoutPromise(),
    ])
  }

  /**
   * Create a promise that rejects after timeout
   */
  private createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `Operation timeout after ${this.config.timeoutMs}ms`,
          ),
        )
      }, this.config.timeoutMs)
    })
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Record metrics for this operation
   */
  private recordMetrics(
    attempt: number,
    delayMs: number,
    success: boolean,
    error: string | undefined,
  ): void {
    const state = this.circuitBreaker.getState()
    const metrics: RetryMetrics = {
      operationName: this.operationName,
      timestamp: new Date(),
      attempt,
      totalRetries: this.config.maxRetries,
      success,
      error,
      durationMs: Date.now() % 1000, // Simplified duration tracking
      delayMs,
      circuitBreakerState: state,
    }

    this.metrics.push(metrics)

    // Call metrics callback if provided
    if (this.metricsCallback) {
      this.metricsCallback(metrics)
    }
  }

  /**
   * Get collected metrics
   */
  getMetrics(): RetryMetrics[] {
    return [...this.metrics]
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): string {
    return this.circuitBreaker.getStatus()
  }

  /**
   * Reset metrics and circuit breaker
   */
  reset(): void {
    this.metrics = []
    this.circuitBreaker.reset()
  }
}

/**
 * Helper function to execute with retry
 * @param operationName - Name of operation for logging
 * @param config - Retry configuration
 * @param fn - Async function to execute
 * @returns Result of function
 */
export async function executeWithRetry<T>(
  operationName: string,
  config: RetryConfig,
  fn: () => Promise<T>,
  metricsCallback?: MetricsCallback,
): Promise<T> {
  const executor = new RetryExecutor(operationName, config, metricsCallback)
  return executor.execute(fn)
}
