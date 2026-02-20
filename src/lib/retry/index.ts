/**
 * Retry Logic Framework - Public API
 * Main entry point for retry logic, circuit breaker, and monitoring
 */

// Types
export * from './types'

// Policy engine
export {
  calculateDelay,
  matchesErrorPattern,
  getErrorMessage,
  shouldRetry,
  validateRetryConfig,
  describeRetryPolicy,
} from './policy'

// Circuit breaker
export {
  CircuitBreaker,
  getOrCreateCircuitBreaker,
  getAllCircuitBreakers,
  resetAllCircuitBreakers,
  getAllCircuitBreakerStatus,
  type CircuitBreakerMetrics,
} from './circuit-breaker'

// Retry executor
export {
  RetryExecutor,
  executeWithRetry,
  type MetricsCallback,
  RETRY_CONFIGS,
} from './executor'

// Monitoring
export {
  getMetricsCollector,
  recordMetric,
  getAggregatedMetrics,
  getAllAggregatedMetrics,
  getStatusReport,
  logStatusReport,
  type AggregatedMetrics,
} from './monitoring'

/**
 * Quick-start: Execute with retry using predefined config
 *
 * @example
 * ```ts
 * import { retry, RETRY_CONFIGS } from '@/lib/retry'
 *
 * // Use predefined OpenAI config
 * const result = await retry.openai(async () => {
 *   return await openai.chat.completions.create(...)
 * })
 *
 * // Use custom config
 * const result = await retry.custom({
 *   baseDelayMs: 1000,
 *   maxDelayMs: 10000,
 *   maxRetries: 5,
 *   // ... other config
 * }, async () => {
 *   return await someAsyncOperation()
 * })
 * ```
 */

import { executeWithRetry, RETRY_CONFIGS } from './executor'
import { recordMetric } from './monitoring'

export const retry = {
  /**
   * Execute with OpenAI retry config
   */
  openai: async <T>(fn: () => Promise<T>): Promise<T> => {
    return executeWithRetry('openai-api', RETRY_CONFIGS.OPENAI_API, fn, recordMetric)
  },

  /**
   * Execute with ElevenLabs retry config
   */
  elevenlabs: async <T>(fn: () => Promise<T>): Promise<T> => {
    return executeWithRetry(
      'elevenlabs-api',
      RETRY_CONFIGS.ELEVENLABS_API,
      fn,
      recordMetric,
    )
  },

  /**
   * Execute with Firebase retry config
   */
  firebase: async <T>(fn: () => Promise<T>): Promise<T> => {
    return executeWithRetry('firebase-db', RETRY_CONFIGS.FIREBASE_DB, fn, recordMetric)
  },

  /**
   * Execute with Stripe retry config
   */
  stripe: async <T>(fn: () => Promise<T>): Promise<T> => {
    return executeWithRetry('stripe-api', RETRY_CONFIGS.STRIPE_API, fn, recordMetric)
  },

  /**
   * Execute with custom retry config
   */
  custom: async <T>(
    operationName: string,
    config: typeof RETRY_CONFIGS.OPENAI_API,
    fn: () => Promise<T>,
  ): Promise<T> => {
    return executeWithRetry(operationName, config, fn, recordMetric)
  },
}
