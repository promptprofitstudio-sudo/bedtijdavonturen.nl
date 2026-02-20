/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by stopping requests to failing services
 */

import { CircuitBreakerConfig, CircuitBreakerState, CircuitBreakerOpenError } from './types'

export interface CircuitBreakerMetrics {
  failureCount: number
  successCount: number
  lastFailureTime: number
  lastSuccessTime: number
  totalRequests: number
  totalFailures: number
}

/**
 * Circuit Breaker Implementation
 * States: closed (normal) -> open (failing) -> half-open (testing) -> closed
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = 'closed'
  private failureCount = 0
  private successCount = 0
  private lastFailureTime = 0
  private lastSuccessTime = 0
  private totalRequests = 0
  private totalFailures = 0

  constructor(
    private operationName: string,
    private config: CircuitBreakerConfig,
  ) {}

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    // Auto-transition from open to half-open after resetTimeout
    if (
      this.state === 'open' &&
      Date.now() - this.lastFailureTime >= this.config.resetTimeoutMs
    ) {
      this.state = 'half-open'
      this.successCount = 0
      console.log(
        `[CircuitBreaker] ${this.operationName}: Transitioning to HALF-OPEN`,
      )
    }

    return this.state
  }

  /**
   * Record a successful operation
   */
  recordSuccess(): void {
    this.totalRequests++
    this.lastSuccessTime = Date.now()

    if (this.state === 'half-open') {
      this.successCount++

      if (this.successCount >= this.config.successThreshold) {
        this.state = 'closed'
        this.failureCount = 0
        this.successCount = 0
        console.log(
          `[CircuitBreaker] ${this.operationName}: Transitioning to CLOSED`,
        )
      }
    } else if (this.state === 'open') {
      // Stay open until half-open transition happens
      return
    } else {
      // Closed state - reset failure count on success
      this.failureCount = 0
    }
  }

  /**
   * Record a failed operation
   */
  recordFailure(): void {
    this.totalRequests++
    this.totalFailures++
    this.lastFailureTime = Date.now()

    if (this.state === 'half-open') {
      // One failure in half-open state closes the circuit
      this.state = 'open'
      this.failureCount = this.config.failureThreshold
      console.log(
        `[CircuitBreaker] ${this.operationName}: Transitioning back to OPEN (half-open failed)`,
      )
      return
    }

    this.failureCount++

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'open'
      console.log(
        `[CircuitBreaker] ${this.operationName}: Transitioning to OPEN (failures: ${this.failureCount})`,
      )
    }
  }

  /**
   * Check if operation should be allowed
   * @throws CircuitBreakerOpenError if circuit is open
   */
  checkState(): void {
    const state = this.getState()

    if (state === 'open') {
      const timeUntilRetry = Math.max(
        0,
        this.config.resetTimeoutMs - (Date.now() - this.lastFailureTime),
      )
      throw new CircuitBreakerOpenError(
        this.operationName,
        this.failureCount,
        timeUntilRetry,
      )
    }
  }

  /**
   * Get metrics about circuit breaker
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
    }
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.state = 'closed'
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = 0
    this.lastSuccessTime = 0
    console.log(`[CircuitBreaker] ${this.operationName}: Manually reset to CLOSED`)
  }

  /**
   * Get human-readable status
   */
  getStatus(): string {
    const state = this.getState()
    const metrics = this.getMetrics()
    const failureRate =
      metrics.totalRequests > 0
        ? ((metrics.totalFailures / metrics.totalRequests) * 100).toFixed(1)
        : '0'
    return `${this.operationName}: ${state.toUpperCase()} (failures: ${metrics.failureCount}/${this.config.failureThreshold}, rate: ${failureRate}%)`
  }
}

/**
 * Global circuit breaker registry
 */
const circuitBreakers = new Map<string, CircuitBreaker>()

/**
 * Get or create a circuit breaker for an operation
 * @param operationName - Unique name for the operation
 * @param config - Circuit breaker configuration
 * @returns CircuitBreaker instance
 */
export function getOrCreateCircuitBreaker(
  operationName: string,
  config: CircuitBreakerConfig,
): CircuitBreaker {
  if (!circuitBreakers.has(operationName)) {
    circuitBreakers.set(operationName, new CircuitBreaker(operationName, config))
  }
  return circuitBreakers.get(operationName)!
}

/**
 * Get all registered circuit breakers
 */
export function getAllCircuitBreakers(): CircuitBreaker[] {
  return Array.from(circuitBreakers.values())
}

/**
 * Reset all circuit breakers
 */
export function resetAllCircuitBreakers(): void {
  circuitBreakers.forEach((cb) => cb.reset())
  console.log('[CircuitBreaker] All circuit breakers reset')
}

/**
 * Get status of all circuit breakers
 */
export function getAllCircuitBreakerStatus(): string[] {
  return Array.from(circuitBreakers.values()).map((cb) => cb.getStatus())
}
