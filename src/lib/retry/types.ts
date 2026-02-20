/**
 * Retry Policy Framework Types
 * Defines retry strategies, configurations, and state management
 */

/** Retry strategy types */
export type RetryStrategy = 'exponential-backoff' | 'linear' | 'fixed'

/** Circuit breaker states */
export type CircuitBreakerState = 'closed' | 'open' | 'half-open'

/**
 * Configuration for a single retry policy
 */
export interface RetryPolicyConfig {
  /** Strategy for calculating wait times between retries */
  strategy: RetryStrategy

  /** Base delay in milliseconds */
  baseDelayMs: number

  /** Maximum delay in milliseconds */
  maxDelayMs: number

  /** Maximum number of retry attempts (not including initial attempt) */
  maxRetries: number

  /** Whether to add jitter (randomization) to delays */
  jitter: boolean

  /** Error codes/patterns that should NOT be retried (fail fast) */
  noRetryPatterns: (string | RegExp)[]

  /** Error codes/patterns that SHOULD always be retried */
  alwaysRetryPatterns: (string | RegExp)[]

  /** Timeout per attempt in milliseconds */
  timeoutMs: number
}

/**
 * Configuration for circuit breaker
 */
export interface CircuitBreakerConfig {
  /** Number of failures before circuit opens */
  failureThreshold: number

  /** Time in milliseconds before attempting half-open state */
  resetTimeoutMs: number

  /** Number of successful operations in half-open before closing circuit */
  successThreshold: number
}

/**
 * Combined retry configuration
 */
export interface RetryConfig extends RetryPolicyConfig, CircuitBreakerConfig {}

/**
 * Predefined retry configurations for different APIs
 */
export const RETRY_CONFIGS = {
  OPENAI_API: {
    strategy: 'exponential-backoff' as const,
    baseDelayMs: 2000,
    maxDelayMs: 30000,
    maxRetries: 3,
    jitter: true,
    noRetryPatterns: [
      /invalid.*request/i,
      /authentication.*failed/i,
      /api.*key/i,
      /invalid.*api.*key/i,
      /unauthorized/i,
      /forbidden/i,
      /not found/i,
      /4\d{2}/, // 4xx status codes (client errors)
    ],
    alwaysRetryPatterns: [
      /rate.*limit/i,
      /timeout/i,
      /temporarily unavailable/i,
      /service.*unavailable/i,
      /5\d{2}/, // 5xx status codes (server errors)
    ],
    timeoutMs: 60000,
    failureThreshold: 5,
    resetTimeoutMs: 60000,
    successThreshold: 2,
  } satisfies RetryConfig,

  ELEVENLABS_API: {
    strategy: 'exponential-backoff' as const,
    baseDelayMs: 2000,
    maxDelayMs: 30000,
    maxRetries: 3,
    jitter: true,
    noRetryPatterns: [
      /invalid.*request/i,
      /authentication.*failed/i,
      /api.*key/i,
      /unauthorized/i,
      /forbidden/i,
      /not found/i,
      /invalid.*voice/i,
      /4\d{2}/,
    ],
    alwaysRetryPatterns: [
      /rate.*limit/i,
      /timeout/i,
      /temporarily unavailable/i,
      /service.*unavailable/i,
      /5\d{2}/,
    ],
    timeoutMs: 120000,
    failureThreshold: 5,
    resetTimeoutMs: 60000,
    successThreshold: 2,
  } satisfies RetryConfig,

  FIREBASE_DB: {
    strategy: 'exponential-backoff' as const,
    baseDelayMs: 1000,
    maxDelayMs: 15000,
    maxRetries: 4,
    jitter: true,
    noRetryPatterns: [
      /permission denied/i,
      /authentication failed/i,
      /invalid.*argument/i,
      /not found/i,
    ],
    alwaysRetryPatterns: [
      /unavailable/i,
      /deadline exceeded/i,
      /resource exhausted/i,
      /5\d{2}/,
      /timeout/i,
    ],
    timeoutMs: 30000,
    failureThreshold: 4,
    resetTimeoutMs: 45000,
    successThreshold: 1,
  } satisfies RetryConfig,

  STRIPE_API: {
    strategy: 'exponential-backoff' as const,
    baseDelayMs: 2000,
    maxDelayMs: 30000,
    maxRetries: 3,
    jitter: true,
    noRetryPatterns: [
      /authentication.*failed/i,
      /invalid.*api.*key/i,
      /unauthorized/i,
      /forbidden/i,
      /not found/i,
      /invalid.*request.*id/i,
      /invalid.*charge/i,
      /4\d{2}/,
    ],
    alwaysRetryPatterns: [
      /rate.*limit/i,
      /timeout/i,
      /service.*unavailable/i,
      /temporarily unavailable/i,
      /5\d{2}/,
    ],
    timeoutMs: 45000,
    failureThreshold: 5,
    resetTimeoutMs: 60000,
    successThreshold: 2,
  } satisfies RetryConfig,
}

/**
 * Metrics for retry operations
 */
export interface RetryMetrics {
  operationName: string
  timestamp: Date
  attempt: number
  totalRetries: number
  success: boolean
  error?: string
  durationMs: number
  delayMs: number
  circuitBreakerState: CircuitBreakerState
}

/**
 * Error types
 */
export class RetryableError extends Error {
  constructor(
    message: string,
    public readonly originalError: unknown,
    public readonly attempt: number,
    public readonly maxRetries: number,
  ) {
    super(message)
    this.name = 'RetryableError'
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(
    public readonly operationName: string,
    public readonly failureCount: number,
    public readonly resetTimeMs: number,
  ) {
    super(`Circuit breaker open for ${operationName}. Reset in ${resetTimeMs}ms`)
    this.name = 'CircuitBreakerOpenError'
  }
}
