/**
 * Tests for Retry Policy Engine
 */

import { describe, it, expect } from 'vitest'
import {
  calculateDelay,
  matchesErrorPattern,
  getErrorMessage,
  shouldRetry,
  validateRetryConfig,
  describeRetryPolicy,
} from './policy'
import { RETRY_CONFIGS, RetryPolicyConfig } from './types'

describe('calculateDelay', () => {
  it('should calculate exponential backoff correctly', () => {
    // First retry: 2000 * 2^0 = 2000
    expect(calculateDelay('exponential-backoff', 0, 2000, 30000, false)).toBe(2000)

    // Second retry: 2000 * 2^1 = 4000
    expect(calculateDelay('exponential-backoff', 1, 2000, 30000, false)).toBe(4000)

    // Third retry: 2000 * 2^2 = 8000
    expect(calculateDelay('exponential-backoff', 2, 2000, 30000, false)).toBe(8000)

    // Fourth retry: 2000 * 2^3 = 16000
    expect(calculateDelay('exponential-backoff', 3, 2000, 30000, false)).toBe(16000)
  })

  it('should cap delay at maxDelayMs', () => {
    // Without cap: 2000 * 2^4 = 32000, but maxDelayMs = 30000
    expect(calculateDelay('exponential-backoff', 4, 2000, 30000, false)).toBe(30000)
  })

  it('should calculate linear backoff correctly', () => {
    // First: 2000 * 1 = 2000
    expect(calculateDelay('linear', 0, 2000, 30000, false)).toBe(2000)

    // Second: 2000 * 2 = 4000
    expect(calculateDelay('linear', 1, 2000, 30000, false)).toBe(4000)

    // Third: 2000 * 3 = 6000
    expect(calculateDelay('linear', 2, 2000, 30000, false)).toBe(6000)
  })

  it('should keep fixed delay constant', () => {
    expect(calculateDelay('fixed', 0, 2000, 30000, false)).toBe(2000)
    expect(calculateDelay('fixed', 1, 2000, 30000, false)).toBe(2000)
    expect(calculateDelay('fixed', 5, 2000, 30000, false)).toBe(2000)
  })

  it('should add jitter to delay', () => {
    const delayWithJitter = calculateDelay('exponential-backoff', 0, 2000, 30000, true)

    // With jitter, should be between 0 and 2000
    expect(delayWithJitter).toBeGreaterThanOrEqual(0)
    expect(delayWithJitter).toBeLessThanOrEqual(2000)
  })

  it('should return integer delays', () => {
    const delay = calculateDelay('exponential-backoff', 0, 2000, 30000, true)
    expect(Number.isInteger(delay)).toBe(true)
  })
})

describe('getErrorMessage', () => {
  it('should extract message from Error objects', () => {
    const error = new Error('Test error message')
    expect(getErrorMessage(error)).toBe('Test error message')
  })

  it('should handle string errors', () => {
    expect(getErrorMessage('String error')).toBe('String error')
  })

  it('should handle unknown objects', () => {
    const result = getErrorMessage({})
    expect(typeof result).toBe('string')
  })

  it('should extract status from API response errors', () => {
    const error = {
      response: {
        status: 429,
        statusText: 'Too Many Requests',
        data: { message: 'Rate limit exceeded' },
      },
    }
    const message = getErrorMessage(error)
    expect(message).toContain('429')
  })

  it('should handle objects with message property', () => {
    const error = { message: 'Custom error' }
    expect(getErrorMessage(error)).toBe('Custom error')
  })
})

describe('matchesErrorPattern', () => {
  it('should match string patterns case-insensitively', () => {
    const patterns = ['rate limit', 'timeout']
    expect(matchesErrorPattern('Rate Limit Exceeded', patterns)).toBe(true)
    expect(matchesErrorPattern('TIMEOUT ERROR', patterns)).toBe(true)
    expect(matchesErrorPattern('Connection refused', patterns)).toBe(false)
  })

  it('should match regex patterns', () => {
    const patterns = [/5\d{2}/, /rate.*limit/i]
    expect(matchesErrorPattern('500 Internal Server Error', patterns)).toBe(true)
    expect(matchesErrorPattern('Rate Limit Exceeded', patterns)).toBe(true)
    expect(matchesErrorPattern('404 Not Found', patterns)).toBe(false)
  })

  it('should handle mixed string and regex patterns', () => {
    const patterns: (string | RegExp)[] = ['timeout', /\d{3}/]
    expect(matchesErrorPattern('Request timeout', patterns)).toBe(true)
    expect(matchesErrorPattern('Error 500', patterns)).toBe(true)
  })

  it('should handle Error objects', () => {
    const error = new Error('Rate limit exceeded')
    const patterns = ['rate limit']
    expect(matchesErrorPattern(error, patterns)).toBe(true)
  })
})

describe('shouldRetry', () => {
  const config: RetryPolicyConfig = {
    strategy: 'exponential-backoff',
    baseDelayMs: 2000,
    maxDelayMs: 30000,
    maxRetries: 3,
    jitter: true,
    noRetryPatterns: [/invalid/i, /authentication failed/i],
    alwaysRetryPatterns: [/timeout/i, /5\d{2}/],
    timeoutMs: 60000,
  }

  it('should return false when max retries exhausted', () => {
    expect(shouldRetry(new Error('Some error'), 3, config)).toBe(false)
  })

  it('should return true for errors matching alwaysRetryPatterns', () => {
    expect(shouldRetry(new Error('timeout'), 0, config)).toBe(true)
    expect(shouldRetry(new Error('Server 500 error'), 1, config)).toBe(true)
  })

  it('should return false for errors matching noRetryPatterns', () => {
    expect(shouldRetry(new Error('Invalid request'), 0, config)).toBe(false)
    expect(shouldRetry(new Error('Authentication failed'), 1, config)).toBe(false)
  })

  it('should default to retrying unknown errors', () => {
    expect(shouldRetry(new Error('Unknown error'), 0, config)).toBe(true)
    expect(shouldRetry(new Error('Connection refused'), 1, config)).toBe(true)
  })
})

describe('validateRetryConfig', () => {
  const validConfig: RetryPolicyConfig = {
    strategy: 'exponential-backoff',
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    maxRetries: 3,
    jitter: true,
    noRetryPatterns: [],
    alwaysRetryPatterns: [],
    timeoutMs: 60000,
  }

  it('should accept valid config', () => {
    expect(() => validateRetryConfig(validConfig)).not.toThrow()
  })

  it('should reject negative baseDelayMs', () => {
    const config = { ...validConfig, baseDelayMs: -1 }
    expect(() => validateRetryConfig(config)).toThrow()
  })

  it('should reject maxDelayMs less than baseDelayMs', () => {
    const config = { ...validConfig, maxDelayMs: 500 }
    expect(() => validateRetryConfig(config)).toThrow()
  })

  it('should reject negative maxRetries', () => {
    const config = { ...validConfig, maxRetries: -1 }
    expect(() => validateRetryConfig(config)).toThrow()
  })

  it('should reject negative timeoutMs', () => {
    const config = { ...validConfig, timeoutMs: -1 }
    expect(() => validateRetryConfig(config)).toThrow()
  })
})

describe('describeRetryPolicy', () => {
  it('should create human-readable description', () => {
    const config = RETRY_CONFIGS.OPENAI_API
    const description = describeRetryPolicy(config)

    expect(description).toContain('exponential-backoff')
    expect(description).toContain('2000')
    expect(description).toContain('30000')
    expect(description).toContain('3')
  })
})

describe('RETRY_CONFIGS', () => {
  it('should have all required API configs', () => {
    expect(RETRY_CONFIGS.OPENAI_API).toBeDefined()
    expect(RETRY_CONFIGS.ELEVENLABS_API).toBeDefined()
    expect(RETRY_CONFIGS.FIREBASE_DB).toBeDefined()
    expect(RETRY_CONFIGS.STRIPE_API).toBeDefined()
  })

  it('should have valid configurations', () => {
    Object.values(RETRY_CONFIGS).forEach((config) => {
      expect(() => validateRetryConfig(config)).not.toThrow()
    })
  })

  it('should have exponential backoff strategy', () => {
    Object.values(RETRY_CONFIGS).forEach((config) => {
      expect(config.strategy).toBe('exponential-backoff')
    })
  })

  it('should have jitter enabled', () => {
    Object.values(RETRY_CONFIGS).forEach((config) => {
      expect(config.jitter).toBe(true)
    })
  })
})
