/**
 * Retry Policy Engine
 * Handles retry decision logic, delay calculations, and error classification
 */

import {
  RetryPolicyConfig,
  RetryStrategy,
  CircuitBreakerState,
} from './types'

/**
 * Calculate delay for next retry attempt
 * @param strategy - The retry strategy to use
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay in milliseconds
 * @param jitter - Whether to add randomization
 * @returns Delay in milliseconds
 */
export function calculateDelay(
  strategy: RetryStrategy,
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  jitter: boolean,
): number {
  let delay = baseDelayMs

  if (strategy === 'exponential-backoff') {
    // Exponential backoff: delay = baseDelay * (2 ^ attempt)
    delay = baseDelayMs * Math.pow(2, attempt)
  } else if (strategy === 'linear') {
    // Linear backoff: delay = baseDelay * (attempt + 1)
    delay = baseDelayMs * (attempt + 1)
  }
  // 'fixed' strategy keeps baseDelayMs

  // Cap at maxDelayMs
  delay = Math.min(delay, maxDelayMs)

  // Add jitter: randomize between 0 and calculated delay
  if (jitter) {
    delay = Math.random() * delay
  }

  return Math.floor(delay)
}

/**
 * Determine if an error matches a pattern (string or regex)
 * @param error - The error to check
 * @param patterns - Array of string or regex patterns
 * @returns true if any pattern matches
 */
export function matchesErrorPattern(
  error: unknown,
  patterns: (string | RegExp)[],
): boolean {
  const errorString = getErrorMessage(error)

  return patterns.some((pattern) => {
    if (typeof pattern === 'string') {
      // Case-insensitive string matching
      return errorString.toLowerCase().includes(pattern.toLowerCase())
    }
    return pattern.test(errorString)
  })
}

/**
 * Extract error message from various error types
 * @param error - The error object
 * @returns Standardized error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (error && typeof error === 'object') {
    // Handle axios/fetch response errors
    if ('response' in error && error.response) {
      const response = error.response as any
      return `${response.status || 'unknown'}: ${response.statusText || response.data?.message || 'error'}`
    }
    // Handle generic objects with message
    if ('message' in error) {
      return String(error.message)
    }
  }
  return String(error)
}

/**
 * Determine if an error should be retried
 * @param error - The error that occurred
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Retry policy configuration
 * @returns true if should retry, false if should fail fast
 */
export function shouldRetry(
  error: unknown,
  attempt: number,
  config: RetryPolicyConfig,
): boolean {
  // Already exhausted retries
  if (attempt >= config.maxRetries) {
    return false
  }

  const errorMessage = getErrorMessage(error)

  // Check if this error should always be retried
  if (matchesErrorPattern(error, config.alwaysRetryPatterns)) {
    return true
  }

  // Check if this error should never be retried (fail fast)
  if (matchesErrorPattern(error, config.noRetryPatterns)) {
    return false
  }

  // Default: retry on unknown errors
  return true
}

/**
 * Validate retry configuration
 * @param config - The configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateRetryConfig(config: RetryPolicyConfig): void {
  if (config.baseDelayMs < 0) {
    throw new Error('baseDelayMs must be >= 0')
  }
  if (config.maxDelayMs < config.baseDelayMs) {
    throw new Error('maxDelayMs must be >= baseDelayMs')
  }
  if (config.maxRetries < 0) {
    throw new Error('maxRetries must be >= 0')
  }
  if (config.timeoutMs < 0) {
    throw new Error('timeoutMs must be >= 0')
  }
}

/**
 * Get a human-readable description of a retry policy
 * @param config - The configuration
 * @returns Description string
 */
export function describeRetryPolicy(config: RetryPolicyConfig): string {
  return `${config.strategy} (base: ${config.baseDelayMs}ms, max: ${config.maxDelayMs}ms, retries: ${config.maxRetries}, jitter: ${config.jitter})`
}
