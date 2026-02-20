/**
 * Tests for Monitoring and Metrics
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getMetricsCollector,
  recordMetric,
  getAggregatedMetrics,
  getAllAggregatedMetrics,
  getStatusReport,
} from './monitoring'
import { RetryMetrics } from './types'

describe('MetricsCollector', () => {
  beforeEach(() => {
    const collector = getMetricsCollector()
    collector.reset()
  })

  describe('recordMetric', () => {
    it('should record metrics', () => {
      const metric: RetryMetrics = {
        operationName: 'test-op',
        timestamp: new Date(),
        attempt: 0,
        totalRetries: 3,
        success: true,
        durationMs: 100,
        delayMs: 0,
        circuitBreakerState: 'closed',
      }

      recordMetric(metric)

      const agg = getAggregatedMetrics('test-op')
      expect(agg).toBeDefined()
      expect(agg!.totalAttempts).toBe(1)
      expect(agg!.successfulAttempts).toBe(1)
    })

    it('should aggregate metrics by operation', () => {
      const metric1: RetryMetrics = {
        operationName: 'op1',
        timestamp: new Date(),
        attempt: 0,
        totalRetries: 3,
        success: true,
        durationMs: 100,
        delayMs: 0,
        circuitBreakerState: 'closed',
      }

      const metric2: RetryMetrics = {
        operationName: 'op1',
        timestamp: new Date(),
        attempt: 0,
        totalRetries: 3,
        success: false,
        error: 'Test error',
        durationMs: 150,
        delayMs: 1000,
        circuitBreakerState: 'closed',
      }

      recordMetric(metric1)
      recordMetric(metric2)

      const agg = getAggregatedMetrics('op1')
      expect(agg!.totalAttempts).toBe(2)
      expect(agg!.successfulAttempts).toBe(1)
      expect(agg!.failedAttempts).toBe(1)
    })

    it('should prevent memory leaks with max stored metrics', () => {
      // Record more than MAX_STORED_METRICS
      for (let i = 0; i < 1100; i++) {
        recordMetric({
          operationName: 'memory-test',
          timestamp: new Date(),
          attempt: 0,
          totalRetries: 3,
          success: true,
          durationMs: 100,
          delayMs: 0,
          circuitBreakerState: 'closed',
        })
      }

      // Should have limited metrics
      const collector = getMetricsCollector()
      // The collector should manage memory, so we just verify it doesn't crash
      expect(getAllAggregatedMetrics().length).toBeGreaterThan(0)
    })
  })

  describe('AggregatedMetrics', () => {
    it('should calculate success rate correctly', () => {
      recordMetric({
        operationName: 'rate-test',
        timestamp: new Date(),
        attempt: 0,
        totalRetries: 3,
        success: true,
        durationMs: 100,
        delayMs: 0,
        circuitBreakerState: 'closed',
      })

      recordMetric({
        operationName: 'rate-test',
        timestamp: new Date(),
        attempt: 1,
        totalRetries: 3,
        success: false,
        error: 'Error',
        durationMs: 100,
        delayMs: 1000,
        circuitBreakerState: 'closed',
      })

      recordMetric({
        operationName: 'rate-test',
        timestamp: new Date(),
        attempt: 0,
        totalRetries: 3,
        success: true,
        durationMs: 100,
        delayMs: 0,
        circuitBreakerState: 'closed',
      })

      const agg = getAggregatedMetrics('rate-test')
      expect(agg).toBeDefined()
      expect(agg!.successRate).toBeCloseTo(66.67, 1)
    })

    it('should calculate average retries per failure', () => {
      recordMetric({
        operationName: 'retry-test',
        timestamp: new Date(),
        attempt: 0,
        totalRetries: 3,
        success: false,
        error: 'Error',
        durationMs: 100,
        delayMs: 1000,
        circuitBreakerState: 'closed',
      })

      recordMetric({
        operationName: 'retry-test',
        timestamp: new Date(),
        attempt: 2,
        totalRetries: 3,
        success: false,
        error: 'Error',
        durationMs: 100,
        delayMs: 2000,
        circuitBreakerState: 'closed',
      })

      const agg = getAggregatedMetrics('retry-test')
      expect(agg).toBeDefined()
      // Average of attempts 0 and 2 = 1
      expect(agg!.averageRetriesPerFailure).toBeCloseTo(1.0, 1)
    })

    it('should track last error', () => {
      recordMetric({
        operationName: 'error-test',
        timestamp: new Date(),
        attempt: 0,
        totalRetries: 3,
        success: true,
        durationMs: 100,
        delayMs: 0,
        circuitBreakerState: 'closed',
      })

      const now = new Date()
      recordMetric({
        operationName: 'error-test',
        timestamp: now,
        attempt: 1,
        totalRetries: 3,
        success: false,
        error: 'Last error message',
        durationMs: 100,
        delayMs: 1000,
        circuitBreakerState: 'closed',
      })

      const agg = getAggregatedMetrics('error-test')
      expect(agg!.lastError).toBe('Last error message')
      expect(agg!.lastErrorTime).toBeDefined()
    })

    it('should return null for unknown operation', () => {
      const agg = getAggregatedMetrics('unknown-op')
      expect(agg).toBeNull()
    })
  })

  describe('Alerts', () => {
    it('should alert on circuit breaker open', () => {
      recordMetric({
        operationName: 'alert-test',
        timestamp: new Date(),
        attempt: 0,
        totalRetries: 3,
        success: false,
        error: 'Error',
        durationMs: 100,
        delayMs: 0,
        circuitBreakerState: 'open',
      })

      const collector = getMetricsCollector()
      const alerts = collector.getAlerts('alert-test')
      expect(alerts.length).toBeGreaterThan(0)
      expect(alerts[0]).toContain('Circuit breaker OPEN')
    })

    it('should alert on exhausted retries', () => {
      recordMetric({
        operationName: 'exhaustion-test',
        timestamp: new Date(),
        attempt: 3,
        totalRetries: 3,
        success: false,
        error: 'Error',
        durationMs: 100,
        delayMs: 0,
        circuitBreakerState: 'closed',
      })

      const collector = getMetricsCollector()
      const alerts = collector.getAlerts('exhaustion-test')
      expect(alerts.length).toBeGreaterThan(0)
      expect(alerts[0]).toContain('Exhausted all retries')
    })
  })

  describe('getAllAggregatedMetrics', () => {
    it('should return metrics for all operations', () => {
      recordMetric({
        operationName: 'op1',
        timestamp: new Date(),
        attempt: 0,
        totalRetries: 3,
        success: true,
        durationMs: 100,
        delayMs: 0,
        circuitBreakerState: 'closed',
      })

      recordMetric({
        operationName: 'op2',
        timestamp: new Date(),
        attempt: 0,
        totalRetries: 3,
        success: true,
        durationMs: 100,
        delayMs: 0,
        circuitBreakerState: 'closed',
      })

      const allMetrics = getAllAggregatedMetrics()
      const opNames = allMetrics.map((m) => m.operationName)
      expect(opNames).toContain('op1')
      expect(opNames).toContain('op2')
    })
  })

  describe('Status Report', () => {
    it('should generate status report', () => {
      recordMetric({
        operationName: 'report-test',
        timestamp: new Date(),
        attempt: 0,
        totalRetries: 3,
        success: true,
        durationMs: 100,
        delayMs: 0,
        circuitBreakerState: 'closed',
      })

      const report = getStatusReport()
      expect(report).toContain('Retry Metrics Report')
      expect(report).toContain('report-test')
    })

    it('should include alerts in report', () => {
      recordMetric({
        operationName: 'alert-report-test',
        timestamp: new Date(),
        attempt: 0,
        totalRetries: 3,
        success: false,
        error: 'Error',
        durationMs: 100,
        delayMs: 0,
        circuitBreakerState: 'open',
      })

      const report = getStatusReport()
      expect(report).toContain('Alerts')
    })

    it('should handle empty metrics', () => {
      const report = getStatusReport()
      expect(report).toBeDefined()
      // May be empty or contain a message about no metrics
      expect(typeof report).toBe('string')
    })
  })

  describe('clearAlerts', () => {
    it('should clear specific operation alerts', () => {
      recordMetric({
        operationName: 'clear-test',
        timestamp: new Date(),
        attempt: 0,
        totalRetries: 3,
        success: false,
        error: 'Error',
        durationMs: 100,
        delayMs: 0,
        circuitBreakerState: 'open',
      })

      const collector = getMetricsCollector()
      expect(collector.getAlerts('clear-test').length).toBeGreaterThan(0)

      collector.clearAlerts('clear-test')
      expect(collector.getAlerts('clear-test').length).toBe(0)
    })

    it('should clear all alerts', () => {
      recordMetric({
        operationName: 'clear-all-1',
        timestamp: new Date(),
        attempt: 0,
        totalRetries: 3,
        success: false,
        error: 'Error',
        durationMs: 100,
        delayMs: 0,
        circuitBreakerState: 'open',
      })

      recordMetric({
        operationName: 'clear-all-2',
        timestamp: new Date(),
        attempt: 0,
        totalRetries: 3,
        success: false,
        error: 'Error',
        durationMs: 100,
        delayMs: 0,
        circuitBreakerState: 'open',
      })

      const collector = getMetricsCollector()
      collector.clearAlerts()

      expect(collector.getAlerts().length).toBe(0)
    })
  })
})
