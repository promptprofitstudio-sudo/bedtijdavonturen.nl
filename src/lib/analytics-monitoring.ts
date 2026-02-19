/**
 * Analytics Monitoring & Debugging Utilities
 * 
 * Tracks analytics queue health, delivery rates, and provides
 * visibility into the async analytics system
 */

import 'server-only'

interface AnalyticsMetrics {
    totalEventsQueued: number
    totalEventsProcessed: number
    totalEventsFailed: number
    currentQueueSize: number
    lastProcessedAt: Date | null
    averageProcessingTime: number
    deliveryRate: number // percentage (0-100)
    failureRate: number // percentage (0-100)
}

interface EventLog {
    timestamp: Date
    event: string
    userId: string
    status: 'queued' | 'processed' | 'failed'
    duration?: number
    error?: string
}

class AnalyticsMonitor {
    private metrics: AnalyticsMetrics = {
        totalEventsQueued: 0,
        totalEventsProcessed: 0,
        totalEventsFailed: 0,
        currentQueueSize: 0,
        lastProcessedAt: null,
        averageProcessingTime: 0,
        deliveryRate: 100,
        failureRate: 0
    }

    private eventLogs: EventLog[] = []
    private processingTimes: number[] = []
    private maxLogs = 1000 // Keep last 1000 events in memory

    /**
     * Record an event being queued
     */
    recordEventQueued(event: string, userId: string): void {
        this.metrics.totalEventsQueued++
        this.metrics.currentQueueSize++

        this.addLog({
            timestamp: new Date(),
            event,
            userId,
            status: 'queued'
        })
    }

    /**
     * Record an event being processed successfully
     */
    recordEventProcessed(event: string, userId: string, duration: number): void {
        this.metrics.totalEventsProcessed++
        this.metrics.currentQueueSize = Math.max(0, this.metrics.currentQueueSize - 1)
        this.metrics.lastProcessedAt = new Date()

        this.processingTimes.push(duration)
        this.updateAverageProcessingTime()
        this.updateDeliveryRate()

        this.addLog({
            timestamp: new Date(),
            event,
            userId,
            status: 'processed',
            duration
        })
    }

    /**
     * Record an event processing failure
     */
    recordEventFailed(event: string, userId: string, error: string): void {
        this.metrics.totalEventsFailed++
        this.metrics.currentQueueSize = Math.max(0, this.metrics.currentQueueSize - 1)

        this.updateFailureRate()

        this.addLog({
            timestamp: new Date(),
            event,
            userId,
            status: 'failed',
            error
        })
    }

    /**
     * Get current metrics
     */
    getMetrics(): AnalyticsMetrics {
        return { ...this.metrics }
    }

    /**
     * Get recent event logs (for debugging)
     */
    getRecentLogs(count: number = 50): EventLog[] {
        return this.eventLogs.slice(-count)
    }

    /**
     * Get health status
     */
    getHealthStatus(): {
        status: 'healthy' | 'degraded' | 'critical'
        message: string
        metrics: AnalyticsMetrics
    } {
        const { deliveryRate, failureRate, currentQueueSize } = this.metrics

        if (deliveryRate >= 99 && failureRate < 1 && currentQueueSize < 100) {
            return {
                status: 'healthy',
                message: '✅ Analytics system healthy',
                metrics: this.metrics
            }
        }

        if (deliveryRate >= 95 && failureRate < 5 && currentQueueSize < 500) {
            return {
                status: 'degraded',
                message: '⚠️ Analytics system degraded (check PostHog connection)',
                metrics: this.metrics
            }
        }

        return {
            status: 'critical',
            message: '🚨 Analytics system critical (events may be lost)',
            metrics: this.metrics
        }
    }

    /**
     * Reset metrics (useful for monitoring windows)
     */
    reset(): void {
        this.metrics = {
            totalEventsQueued: 0,
            totalEventsProcessed: 0,
            totalEventsFailed: 0,
            currentQueueSize: 0,
            lastProcessedAt: null,
            averageProcessingTime: 0,
            deliveryRate: 100,
            failureRate: 0
        }
        this.processingTimes = []
        this.eventLogs = []
    }

    /**
     * Generate a monitoring report
     */
    generateReport(): string {
        const health = this.getHealthStatus()
        const m = this.metrics

        return `
📊 ANALYTICS MONITORING REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: ${health.status}
Message: ${health.message}

📈 METRICS:
  • Total Queued: ${m.totalEventsQueued}
  • Total Processed: ${m.totalEventsProcessed}
  • Total Failed: ${m.totalEventsFailed}
  • Current Queue Size: ${m.currentQueueSize}
  • Delivery Rate: ${m.deliveryRate.toFixed(2)}%
  • Failure Rate: ${m.failureRate.toFixed(2)}%
  • Avg Processing Time: ${m.averageProcessingTime.toFixed(2)}ms
  • Last Processed: ${m.lastProcessedAt ? m.lastProcessedAt.toISOString() : 'Never'}

📝 RECENT EVENTS (Last 10):
${this.getRecentLogs(10)
    .map(log => `  ${log.timestamp.toISOString()} | ${log.event} (${log.userId}) - ${log.status}${log.duration ? ` (${log.duration}ms)` : ''}`)
    .join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `
    }

    // Private helpers

    private addLog(log: EventLog): void {
        this.eventLogs.push(log)

        // Keep memory bounded
        if (this.eventLogs.length > this.maxLogs) {
            this.eventLogs = this.eventLogs.slice(-this.maxLogs)
        }
    }

    private updateAverageProcessingTime(): void {
        if (this.processingTimes.length === 0) return

        const sum = this.processingTimes.reduce((a, b) => a + b, 0)
        this.metrics.averageProcessingTime = sum / this.processingTimes.length
    }

    private updateDeliveryRate(): void {
        const total = this.metrics.totalEventsProcessed + this.metrics.totalEventsFailed
        if (total === 0) {
            this.metrics.deliveryRate = 100
            return
        }

        this.metrics.deliveryRate = (this.metrics.totalEventsProcessed / total) * 100
    }

    private updateFailureRate(): void {
        const total = this.metrics.totalEventsProcessed + this.metrics.totalEventsFailed
        if (total === 0) {
            this.metrics.failureRate = 0
            return
        }

        this.metrics.failureRate = (this.metrics.totalEventsFailed / total) * 100
    }
}

// Singleton instance
let monitor: AnalyticsMonitor | null = null

/**
 * Get or create the analytics monitor singleton
 */
export function getAnalyticsMonitor(): AnalyticsMonitor {
    if (!monitor) {
        monitor = new AnalyticsMonitor()
    }
    return monitor
}

/**
 * Convenience function to get metrics
 */
export function getAnalyticsMetrics() {
    return getAnalyticsMonitor().getMetrics()
}

/**
 * Convenience function to get health status
 */
export function getAnalyticsHealth() {
    return getAnalyticsMonitor().getHealthStatus()
}

/**
 * Export analytics report to console (useful for logging)
 */
export function logAnalyticsReport(): void {
    const report = getAnalyticsMonitor().generateReport()
    console.log(report)
}
