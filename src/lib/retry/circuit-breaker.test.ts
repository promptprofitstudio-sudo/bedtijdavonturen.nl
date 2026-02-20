/**
 * Tests for Circuit Breaker
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  CircuitBreaker,
  getOrCreateCircuitBreaker,
  resetAllCircuitBreakers,
  getAllCircuitBreakers,
} from './circuit-breaker'
import { CircuitBreakerConfig, CircuitBreakerOpenError } from './types'

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker
  const config: CircuitBreakerConfig = {
    failureThreshold: 3,
    resetTimeoutMs: 1000,
    successThreshold: 2,
  }

  beforeEach(() => {
    breaker = new CircuitBreaker('test-operation', config)
  })

  describe('Initial State', () => {
    it('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe('closed')
    })

    it('should have zero failures initially', () => {
      const metrics = breaker.getMetrics()
      expect(metrics.failureCount).toBe(0)
      expect(metrics.successCount).toBe(0)
    })
  })

  describe('recordSuccess', () => {
    it('should reset failure count on success in CLOSED state', () => {
      breaker.recordFailure()
      breaker.recordFailure()
      expect(breaker.getMetrics().failureCount).toBe(2)

      breaker.recordSuccess()
      expect(breaker.getMetrics().failureCount).toBe(0)
    })

    it('should increment success count in HALF-OPEN state', () => {
      // Open the circuit
      breaker.recordFailure()
      breaker.recordFailure()
      breaker.recordFailure()
      expect(breaker.getState()).toBe('open')

      // Fast-forward past reset timeout
      vi.useFakeTimers()
      vi.advanceTimersByTime(config.resetTimeoutMs + 1)

      // Should transition to HALF-OPEN
      expect(breaker.getState()).toBe('half-open')

      // Record success
      breaker.recordSuccess()
      expect(breaker.getMetrics().successCount).toBe(1)

      vi.useRealTimers()
    })

    it('should close circuit after sufficient successes in HALF-OPEN', () => {
      // Open the circuit
      breaker.recordFailure()
      breaker.recordFailure()
      breaker.recordFailure()
      expect(breaker.getState()).toBe('open')

      // Transition to HALF-OPEN
      vi.useFakeTimers()
      vi.advanceTimersByTime(config.resetTimeoutMs + 1)
      expect(breaker.getState()).toBe('half-open')

      // Record successes
      breaker.recordSuccess()
      expect(breaker.getState()).toBe('half-open')

      breaker.recordSuccess()
      expect(breaker.getState()).toBe('closed')

      vi.useRealTimers()
    })
  })

  describe('recordFailure', () => {
    it('should increment failure count', () => {
      expect(breaker.getMetrics().failureCount).toBe(0)

      breaker.recordFailure()
      expect(breaker.getMetrics().failureCount).toBe(1)

      breaker.recordFailure()
      expect(breaker.getMetrics().failureCount).toBe(2)
    })

    it('should open circuit when failure threshold is reached', () => {
      expect(breaker.getState()).toBe('closed')

      breaker.recordFailure()
      breaker.recordFailure()
      expect(breaker.getState()).toBe('closed')

      breaker.recordFailure() // Third failure reaches threshold
      expect(breaker.getState()).toBe('open')
    })

    it('should immediately close circuit on failure in HALF-OPEN state', () => {
      // Open circuit
      breaker.recordFailure()
      breaker.recordFailure()
      breaker.recordFailure()
      expect(breaker.getState()).toBe('open')

      // Transition to HALF-OPEN
      vi.useFakeTimers()
      vi.advanceTimersByTime(config.resetTimeoutMs + 1)
      expect(breaker.getState()).toBe('half-open')

      // One failure closes it
      breaker.recordFailure()
      expect(breaker.getState()).toBe('open')

      vi.useRealTimers()
    })
  })

  describe('checkState', () => {
    it('should not throw when CLOSED', () => {
      expect(() => breaker.checkState()).not.toThrow()
    })

    it('should not throw when HALF-OPEN', () => {
      // Open circuit
      breaker.recordFailure()
      breaker.recordFailure()
      breaker.recordFailure()

      // Transition to HALF-OPEN
      vi.useFakeTimers()
      vi.advanceTimersByTime(config.resetTimeoutMs + 1)

      expect(() => breaker.checkState()).not.toThrow()

      vi.useRealTimers()
    })

    it('should throw CircuitBreakerOpenError when OPEN', () => {
      breaker.recordFailure()
      breaker.recordFailure()
      breaker.recordFailure()

      expect(() => breaker.checkState()).toThrow(CircuitBreakerOpenError)
    })

    it('should include reset time in error', () => {
      breaker.recordFailure()
      breaker.recordFailure()
      breaker.recordFailure()

      try {
        breaker.checkState()
        throw new Error('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(CircuitBreakerOpenError)
        const error = e as CircuitBreakerOpenError
        expect(error.operationName).toBe('test-operation')
        expect(error.resetTimeMs).toBeGreaterThan(0)
      }
    })
  })

  describe('Auto-transition OPEN -> HALF-OPEN', () => {
    it('should auto-transition after reset timeout', () => {
      vi.useFakeTimers()

      // Open the circuit
      breaker.recordFailure()
      breaker.recordFailure()
      breaker.recordFailure()
      expect(breaker.getState()).toBe('open')

      // Still open before timeout
      vi.advanceTimersByTime(config.resetTimeoutMs - 100)
      expect(breaker.getState()).toBe('open')

      // Should transition after timeout
      vi.advanceTimersByTime(101)
      expect(breaker.getState()).toBe('half-open')

      vi.useRealTimers()
    })
  })

  describe('Metrics', () => {
    it('should track total requests', () => {
      breaker.recordSuccess()
      breaker.recordSuccess()
      breaker.recordFailure()

      const metrics = breaker.getMetrics()
      expect(metrics.totalRequests).toBe(3)
      expect(metrics.totalFailures).toBe(1)
    })

    it('should track last failure time', () => {
      const beforeFailure = Date.now()
      breaker.recordFailure()
      const afterFailure = Date.now()

      const metrics = breaker.getMetrics()
      expect(metrics.lastFailureTime).toBeGreaterThanOrEqual(beforeFailure)
      expect(metrics.lastFailureTime).toBeLessThanOrEqual(afterFailure)
    })

    it('should track last success time', () => {
      const beforeSuccess = Date.now()
      breaker.recordSuccess()
      const afterSuccess = Date.now()

      const metrics = breaker.getMetrics()
      expect(metrics.lastSuccessTime).toBeGreaterThanOrEqual(beforeSuccess)
      expect(metrics.lastSuccessTime).toBeLessThanOrEqual(afterSuccess)
    })
  })

  describe('reset', () => {
    it('should reset to CLOSED state', () => {
      breaker.recordFailure()
      breaker.recordFailure()
      breaker.recordFailure()
      expect(breaker.getState()).toBe('open')

      breaker.reset()
      expect(breaker.getState()).toBe('closed')
      expect(breaker.getMetrics().failureCount).toBe(0)
    })
  })

  describe('getStatus', () => {
    it('should return human-readable status', () => {
      const status = breaker.getStatus()
      expect(status).toContain('test-operation')
      expect(status).toContain('CLOSED')
    })
  })
})

describe('Circuit Breaker Registry', () => {
  beforeEach(() => {
    resetAllCircuitBreakers()
  })

  it('should create circuit breaker on demand', () => {
    const config: CircuitBreakerConfig = {
      failureThreshold: 3,
      resetTimeoutMs: 1000,
      successThreshold: 1,
    }

    const breaker = getOrCreateCircuitBreaker('test-op', config)
    expect(breaker).toBeDefined()
    expect(breaker.getState()).toBe('closed')
  })

  it('should return same instance for same operation', () => {
    const config: CircuitBreakerConfig = {
      failureThreshold: 3,
      resetTimeoutMs: 1000,
      successThreshold: 1,
    }

    const breaker1 = getOrCreateCircuitBreaker('op1', config)
    const breaker2 = getOrCreateCircuitBreaker('op1', config)

    expect(breaker1).toBe(breaker2)
  })

  it('should manage multiple circuit breakers', () => {
    const config: CircuitBreakerConfig = {
      failureThreshold: 3,
      resetTimeoutMs: 1000,
      successThreshold: 1,
    }

    getOrCreateCircuitBreaker('op1', config)
    getOrCreateCircuitBreaker('op2', config)
    getOrCreateCircuitBreaker('op3', config)

    const allBreakers = getAllCircuitBreakers()
    expect(allBreakers.length).toBeGreaterThanOrEqual(3)
  })

  it('should reset all circuit breakers', () => {
    const config: CircuitBreakerConfig = {
      failureThreshold: 1,
      resetTimeoutMs: 1000,
      successThreshold: 1,
    }

    // Create fresh breakers with unique names to avoid beforeEach reset
    const breaker1 = getOrCreateCircuitBreaker('test-reset-op1', config)
    const breaker2 = getOrCreateCircuitBreaker('test-reset-op2', config)

    breaker1.recordFailure()
    breaker2.recordFailure()

    expect(breaker1.getState()).toBe('open')
    expect(breaker2.getState()).toBe('open')

    breaker1.reset()
    breaker2.reset()

    expect(breaker1.getState()).toBe('closed')
    expect(breaker2.getState()).toBe('closed')
  })
})
