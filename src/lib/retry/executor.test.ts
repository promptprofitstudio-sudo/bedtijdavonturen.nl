/**
 * Tests for Retry Executor
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RetryExecutor, executeWithRetry } from './executor'
import { RetryableError, CircuitBreakerOpenError, RETRY_CONFIGS } from './types'
import { resetAllCircuitBreakers } from './circuit-breaker'

describe('RetryExecutor', () => {
  beforeEach(() => {
    resetAllCircuitBreakers()
  })

  describe('Successful execution', () => {
    it('should return result on first attempt success', async () => {
      const executor = new RetryExecutor('test-op', RETRY_CONFIGS.OPENAI_API)
      const result = await executor.execute(async () => 'success')

      expect(result).toBe('success')
    })

    it('should retry on transient errors', async () => {
      let attempts = 0
      const executor = new RetryExecutor('test-op', RETRY_CONFIGS.OPENAI_API)

      const result = await executor.execute(async () => {
        attempts++
        if (attempts < 3) {
          throw new Error('Service unavailable (5xx)')
        }
        return 'success'
      })

      expect(result).toBe('success')
      expect(attempts).toBe(3)
    })

    it('should fail fast on non-retryable errors', async () => {
      let attempts = 0
      const executor = new RetryExecutor('test-op', RETRY_CONFIGS.OPENAI_API)

      try {
        await executor.execute(async () => {
          attempts++
          throw new Error('Invalid API key')
        })
        throw new Error('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RetryableError)
        expect(attempts).toBe(1) // Only attempted once
      }
    })
  })

  describe('Retry limits', () => {
    it('should exhaust max retries before failing', async () => {
      let attempts = 0
      const executor = new RetryExecutor('test-op', {
        ...RETRY_CONFIGS.OPENAI_API,
        maxRetries: 2,
        baseDelayMs: 10,
        maxDelayMs: 10,
      })

      try {
        await executor.execute(async () => {
          attempts++
          throw new Error('Service unavailable')
        })
        throw new Error('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RetryableError)
        expect(attempts).toBe(3) // Initial + 2 retries
      }
    })

    it('should include attempt information in error', async () => {
      const executor = new RetryExecutor('test-op', {
        ...RETRY_CONFIGS.OPENAI_API,
        maxRetries: 2,
        baseDelayMs: 1,
        maxDelayMs: 1,
      })

      try {
        await executor.execute(async () => {
          throw new Error('Timeout')
        })
        throw new Error('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RetryableError)
        const retryError = error as RetryableError
        expect(retryError.attempt).toBe(3)
        expect(retryError.maxRetries).toBe(2)
      }
    })
  })

  describe('Circuit breaker integration', () => {
    it('should open circuit after failure threshold', async () => {
      const config = {
        ...RETRY_CONFIGS.OPENAI_API,
        baseDelayMs: 1,
        maxDelayMs: 1,
        maxRetries: 1,
        failureThreshold: 2,
      }

      const executor = new RetryExecutor('api-call', config)

      // First call: fails and is retried
      try {
        await executor.execute(async () => {
          throw new Error('Service error')
        })
      } catch {
        // Expected to fail
      }

      // Second call: fails and opens circuit
      try {
        await executor.execute(async () => {
          throw new Error('Service error')
        })
      } catch {
        // Expected to fail
      }

      // Third call: should be blocked by circuit breaker
      try {
        await executor.execute(async () => 'should not reach here')
        throw new Error('Should have thrown CircuitBreakerOpenError')
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitBreakerOpenError)
      }
    }, 5000)

    it('should recover after circuit reset timeout', async () => {
      const config = {
        ...RETRY_CONFIGS.OPENAI_API,
        baseDelayMs: 1,
        maxDelayMs: 1,
        maxRetries: 1,
        failureThreshold: 1,
        resetTimeoutMs: 100,
      }

      const executor = new RetryExecutor('api-call', config)

      // Open circuit
      try {
        await executor.execute(async () => {
          throw new Error('Service error')
        })
      } catch {
        // Expected
      }

      // Wait for reset timeout and then try again
      await new Promise((resolve) => setTimeout(resolve, config.resetTimeoutMs + 50))

      // Should succeed if operation succeeds
      const result = await executor.execute(async () => 'recovered')
      expect(result).toBe('recovered')
    }, 5000)
  })

  describe('Timeout handling', () => {
    it('should timeout if operation exceeds timeout', async () => {
      const executor = new RetryExecutor('test-op', {
        ...RETRY_CONFIGS.OPENAI_API,
        timeoutMs: 50,
        maxRetries: 0,
        baseDelayMs: 1,
        maxDelayMs: 1,
      })

      try {
        await executor.execute(async () => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve('done')
            }, 500)
          })
        })
        throw new Error('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(RetryableError)
        const retryError = error as RetryableError
        expect(retryError.message).toContain('timeout')
      }
    }, 3000)
  })

  describe('Metrics collection', () => {
    it('should collect metrics for each attempt', async () => {
      const executor = new RetryExecutor('test-op', {
        ...RETRY_CONFIGS.OPENAI_API,
        maxRetries: 1,
        baseDelayMs: 1,
        maxDelayMs: 1,
      })

      let attempts = 0
      try {
        await executor.execute(async () => {
          attempts++
          throw new Error('Service error')
        })
      } catch {
        // Expected
      }

      const metrics = executor.getMetrics()
      expect(metrics.length).toBeGreaterThan(0)

      // All metrics should be for this operation
      metrics.forEach((metric) => {
        expect(metric.operationName).toBe('test-op')
      })
    }, 3000)

    it('should track success in metrics', async () => {
      const executor = new RetryExecutor('test-op', RETRY_CONFIGS.OPENAI_API)

      await executor.execute(async () => 'success')

      const metrics = executor.getMetrics()
      expect(metrics.length).toBeGreaterThan(0)

      const lastMetric = metrics[metrics.length - 1]
      expect(lastMetric.success).toBe(true)
    })

    it('should track failure in metrics', async () => {
      const executor = new RetryExecutor('test-op', {
        ...RETRY_CONFIGS.OPENAI_API,
        maxRetries: 1,
        baseDelayMs: 1,
        maxDelayMs: 1,
      })

      try {
        await executor.execute(async () => {
          throw new Error('Operation failed')
        })
      } catch {
        // Expected
      }

      const metrics = executor.getMetrics()
      expect(metrics.length).toBeGreaterThan(0)

      const lastMetric = metrics[metrics.length - 1]
      expect(lastMetric.success).toBe(false)
      expect(lastMetric.error).toBeDefined()
    }, 3000)
  })

  describe('Reset', () => {
    it('should clear metrics and reset circuit breaker', async () => {
      const executor = new RetryExecutor('test-op', RETRY_CONFIGS.OPENAI_API)

      await executor.execute(async () => 'success')
      expect(executor.getMetrics().length).toBeGreaterThan(0)

      executor.reset()
      expect(executor.getMetrics().length).toBe(0)
    })
  })

  describe('Circuit breaker status', () => {
    it('should return circuit breaker status', async () => {
      const executor = new RetryExecutor('test-op', RETRY_CONFIGS.OPENAI_API)

      const status = executor.getCircuitBreakerStatus()
      expect(status).toContain('test-op')
      expect(status).toContain('CLOSED')
    })
  })
})

describe('executeWithRetry helper', () => {
  beforeEach(() => {
    resetAllCircuitBreakers()
  })

  it('should execute with retry using predefined config', async () => {
    const result = await executeWithRetry(
      'test-op',
      RETRY_CONFIGS.OPENAI_API,
      async () => 'success',
    )

    expect(result).toBe('success')
  })

  it('should accept metrics callback', async () => {
    const metricsCollected: any[] = []

    await executeWithRetry(
      'test-op',
      RETRY_CONFIGS.OPENAI_API,
      async () => 'success',
      (metrics) => {
        metricsCollected.push(metrics)
      },
    )

    expect(metricsCollected.length).toBeGreaterThan(0)
  })
})
