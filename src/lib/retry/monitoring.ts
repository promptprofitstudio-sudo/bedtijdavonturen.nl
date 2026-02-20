/**
 * Monitoring and Metrics
 * Collects, aggregates, and reports retry metrics
 */

import { RetryMetrics, CircuitBreakerState } from './types'
import { getAllCircuitBreakers } from './circuit-breaker'

/**
 * Aggregated metrics for an operation
 */
export interface AggregatedMetrics {
  operationName: string
  totalAttempts: number
  successfulAttempts: number
  failedAttempts: number
  successRate: number
  averageRetriesPerFailure: number
  circuitBreakerState: CircuitBreakerState
  lastError?: string
  lastErrorTime?: Date
}

/**
 * Metrics storage and reporting
 */
class MetricsCollector {
  private metrics: Map<string, RetryMetrics[]> = new Map()
  private alerts: Map<string, string[]> = new Map()
  private readonly MAX_STORED_METRICS = 1000

  /**
   * Record a metric
   */
  recordMetric(metric: RetryMetrics): void {
    const key = metric.operationName

    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }

    const operationMetrics = this.metrics.get(key)!
    operationMetrics.push(metric)

    // Trim old metrics to prevent memory leaks
    if (operationMetrics.length > this.MAX_STORED_METRICS) {
      operationMetrics.shift()
    }

    // Check for alerts
    this.checkAlerts(metric)
  }

  /**
   * Check if metric should trigger alerts
   */
  private checkAlerts(metric: RetryMetrics): void {
    const key = metric.operationName

    if (!this.alerts.has(key)) {
      this.alerts.set(key, [])
    }

    const alerts = this.alerts.get(key)!

    // Alert if circuit breaker is open
    if (metric.circuitBreakerState === 'open') {
      alerts.push(
        `⚠️ Circuit breaker OPEN for ${metric.operationName} at ${metric.timestamp.toISOString()}`,
      )
    }

    // Alert if too many retries
    if (metric.attempt >= metric.totalRetries) {
      alerts.push(
        `⚠️ Exhausted all retries for ${metric.operationName} after ${metric.attempt + 1} attempts`,
      )
    }

    // Limit stored alerts
    if (alerts.length > 100) {
      alerts.shift()
    }
  }

  /**
   * Get aggregated metrics for an operation
   */
  getAggregatedMetrics(operationName: string): AggregatedMetrics | null {
    const metrics = this.metrics.get(operationName)

    if (!metrics || metrics.length === 0) {
      return null
    }

    const successfulAttempts = metrics.filter((m) => m.success).length
    const failedAttempts = metrics.length - successfulAttempts
    const successRate = (successfulAttempts / metrics.length) * 100

    // Calculate average retries per failure
    const retriesPerFailure = failedAttempts > 0
      ? metrics.filter((m) => !m.success).reduce((sum, m) => sum + m.attempt, 0) /
        failedAttempts
      : 0

    // Get circuit breaker state
    const circuitBreaker = getAllCircuitBreakers().find(
      (cb) => cb['operationName'] === operationName,
    )

    let lastError: string | undefined
    let lastErrorTime: Date | undefined

    // Find last error in metrics (use reverse iteration for compatibility)
    for (let i = metrics.length - 1; i >= 0; i--) {
      if (metrics[i].error) {
        lastError = metrics[i].error
        lastErrorTime = metrics[i].timestamp
        break
      }
    }

    return {
      operationName,
      totalAttempts: metrics.length,
      successfulAttempts,
      failedAttempts,
      successRate,
      averageRetriesPerFailure: retriesPerFailure,
      circuitBreakerState: circuitBreaker?.getState() ?? 'closed',
      lastError,
      lastErrorTime,
    }
  }

  /**
   * Get all aggregated metrics
   */
  getAllAggregatedMetrics(): AggregatedMetrics[] {
    const result: AggregatedMetrics[] = []

    for (const operationName of this.metrics.keys()) {
      const agg = this.getAggregatedMetrics(operationName)
      if (agg) {
        result.push(agg)
      }
    }

    return result
  }

  /**
   * Get recent metrics (last N)
   */
  getRecentMetrics(
    operationName: string,
    limit: number = 50,
  ): RetryMetrics[] {
    const metrics = this.metrics.get(operationName) ?? []
    return metrics.slice(-limit)
  }

  /**
   * Get alerts for an operation
   */
  getAlerts(operationName?: string): string[] {
    if (operationName) {
      return this.alerts.get(operationName) ?? []
    }

    // Get all alerts
    const allAlerts: string[] = []
    for (const alerts of this.alerts.values()) {
      allAlerts.push(...alerts)
    }
    return allAlerts
  }

  /**
   * Clear alerts
   */
  clearAlerts(operationName?: string): void {
    if (operationName) {
      this.alerts.delete(operationName)
    } else {
      this.alerts.clear()
    }
  }

  /**
   * Get comprehensive status report
   */
  getStatusReport(): string {
    const allMetrics = this.getAllAggregatedMetrics()
    const allAlerts = this.getAlerts()

    let report = '📊 Retry Metrics Report\n'
    report += '='.repeat(50) + '\n\n'

    if (allMetrics.length === 0) {
      report += 'No metrics recorded yet.\n'
      return report
    }

    for (const metrics of allMetrics) {
      report += `📌 ${metrics.operationName}\n`
      report += `   Success Rate: ${metrics.successRate.toFixed(1)}% (${metrics.successfulAttempts}/${metrics.totalAttempts})\n`
      report += `   Avg Retries/Failure: ${metrics.averageRetriesPerFailure.toFixed(2)}\n`
      report += `   Circuit Breaker: ${metrics.circuitBreakerState.toUpperCase()}\n`

      if (metrics.lastError) {
        report += `   Last Error: ${metrics.lastError}\n`
        if (metrics.lastErrorTime) {
          report += `   At: ${metrics.lastErrorTime.toISOString()}\n`
        }
      }

      report += '\n'
    }

    if (allAlerts.length > 0) {
      report += '⚠️  Alerts\n'
      report += '-'.repeat(50) + '\n'
      for (const alert of allAlerts.slice(-10)) {
        report += `${alert}\n`
      }
    }

    return report
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear()
    this.alerts.clear()
  }
}

// Global metrics collector instance
const metricsCollector = new MetricsCollector()

/**
 * Get global metrics collector
 */
export function getMetricsCollector(): MetricsCollector {
  return metricsCollector
}

/**
 * Convenience function to record metrics
 */
export function recordMetric(metric: RetryMetrics): void {
  metricsCollector.recordMetric(metric)
}

/**
 * Convenience function to get aggregated metrics
 */
export function getAggregatedMetrics(
  operationName: string,
): AggregatedMetrics | null {
  return metricsCollector.getAggregatedMetrics(operationName)
}

/**
 * Convenience function to get all metrics
 */
export function getAllAggregatedMetrics(): AggregatedMetrics[] {
  return metricsCollector.getAllAggregatedMetrics()
}

/**
 * Convenience function to get status report
 */
export function getStatusReport(): string {
  return metricsCollector.getStatusReport()
}

/**
 * Log comprehensive status to console
 */
export function logStatusReport(): void {
  console.log(getStatusReport())
}
