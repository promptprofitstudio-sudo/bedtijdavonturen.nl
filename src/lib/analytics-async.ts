import 'server-only'

/**
 * Async Analytics Wrapper for PostHog
 * 
 * Key features:
 * - Fire-and-forget pattern (non-blocking)
 * - Batch processing of events
 * - Singleton PostHog client
 * - Error handling with local logging fallback
 * - No impact on user-facing operations
 */

import { getSecret } from '@/lib/secrets'

type AnalyticsEvent = {
    userId: string
    event: string
    properties?: Record<string, any>
}

type QueuedEvent = AnalyticsEvent & {
    timestamp: number
}

// Singleton instance
let posthogClient: any = null
let eventQueue: QueuedEvent[] = []
let batchTimer: NodeJS.Timeout | null = null
let isProcessing = false

const BATCH_SIZE = 10 // Send after 10 events
const BATCH_TIMEOUT_MS = 5000 // Or after 5 seconds

/**
 * Initialize PostHog client (lazy-loaded, singleton)
 */
async function getPostHogClient() {
    if (posthogClient) {
        return posthogClient
    }

    try {
        const { PostHog } = await import('posthog-node')
        const phKey = await getSecret('NEXT_PUBLIC_POSTHOG_KEY')
        const phHost = (await getSecret('NEXT_PUBLIC_POSTHOG_HOST')) || 'https://app.posthog.com'

        if (!phKey) {
            console.warn('⚠️ PostHog Key not configured, analytics will use local logging only')
            return null
        }

        posthogClient = new PostHog(phKey, { 
            host: phHost,
            flushAt: BATCH_SIZE,
            flushInterval: BATCH_TIMEOUT_MS,
            disabled: false
        })

        console.log('✅ PostHog client initialized')
        return posthogClient
    } catch (e) {
        console.error('Failed to initialize PostHog:', e)
        return null
    }
}

/**
 * Process queued events in batch
 */
async function processBatch() {
    if (isProcessing || eventQueue.length === 0) {
        return
    }

    isProcessing = true
    const eventsToProcess = [...eventQueue]
    eventQueue = []

    try {
        const client = await getPostHogClient()

        if (!client) {
            // Fallback: Local logging only
            console.log('📊 [Analytics Queue] Local fallback logging:', {
                count: eventsToProcess.length,
                events: eventsToProcess.map(e => ({
                    event: e.event,
                    userId: e.userId,
                    timestamp: new Date(e.timestamp).toISOString()
                }))
            })

            // Record in monitoring
            try {
                const { getAnalyticsMonitor } = require('@/lib/analytics-monitoring')
                const monitor = getAnalyticsMonitor()
                for (const event of eventsToProcess) {
                    monitor.recordEventProcessed(event.event, event.userId, 0)
                }
            } catch (e) {
                // Monitoring is optional
            }

            return
        }

        // Send all events to PostHog
        const batchStartTime = Date.now()
        for (const event of eventsToProcess) {
            client.capture({
                distinctId: event.userId,
                event: event.event,
                properties: {
                    ...event.properties,
                    app_version: '2.0.0',
                    environment: process.env.NODE_ENV || 'development',
                    queued_at: new Date(event.timestamp).toISOString()
                }
            })
        }

        const processingTime = Date.now() - batchStartTime

        // Record successful processing in monitoring
        try {
            const { getAnalyticsMonitor } = require('@/lib/analytics-monitoring')
            const monitor = getAnalyticsMonitor()
            for (const event of eventsToProcess) {
                monitor.recordEventProcessed(event.event, event.userId, processingTime / eventsToProcess.length)
            }
        } catch (e) {
            // Monitoring is optional
        }

        // Don't await shutdown - let it happen in background
        // This is critical for non-blocking behavior
        console.log(`📤 Sent ${eventsToProcess.length} analytics events to PostHog (async, ${processingTime}ms)`)

    } catch (e) {
        console.error('Failed to process analytics batch:', e)

        // Record failures in monitoring
        try {
            const { getAnalyticsMonitor } = require('@/lib/analytics-monitoring')
            const monitor = getAnalyticsMonitor()
            for (const event of eventsToProcess) {
                monitor.recordEventFailed(event.event, event.userId, e instanceof Error ? e.message : 'Unknown error')
            }
        } catch (monErr) {
            // Monitoring is optional
        }

        // Put events back in queue for retry (with a limit to prevent infinite loops)
        if (eventsToProcess.length > 0) {
            eventQueue.push(...eventsToProcess.slice(0, 5))
        }
    } finally {
        isProcessing = false

        // Schedule next batch if there are more events
        if (eventQueue.length >= BATCH_SIZE) {
            processBatchWithDelay()
        }
    }
}

/**
 * Schedule batch processing with debounce
 */
function processBatchWithDelay() {
    if (batchTimer) {
        clearTimeout(batchTimer)
    }

    batchTimer = setTimeout(() => {
        processBatch()
    }, BATCH_TIMEOUT_MS)
}

/**
 * Queue an analytics event (non-blocking, returns immediately)
 * This is the public API - use this instead of direct PostHog calls
 */
export function trackServerEventAsync(event: AnalyticsEvent): void {
    try {
        // Add to queue immediately
        eventQueue.push({
            ...event,
            timestamp: Date.now()
        })

        // Log locally for debugging
        console.log(`📝 [Analytics] Queued event: ${event.event} (queue size: ${eventQueue.length})`)

        // Record in monitoring (optional - only if available)
        try {
            const { getAnalyticsMonitor } = require('@/lib/analytics-monitoring')
            const monitor = getAnalyticsMonitor()
            monitor.recordEventQueued(event.event, event.userId)
        } catch (e) {
            // Monitoring is optional, don't let it block
        }

        // Trigger batch processing if threshold reached
        if (eventQueue.length >= BATCH_SIZE) {
            // Process immediately, don't wait
            processBatch()
        } else {
            // Otherwise schedule for later
            processBatchWithDelay()
        }
    } catch (e) {
        console.error('Failed to queue analytics event:', e)
    }

    // IMPORTANT: Return immediately - don't await anything!
    // This is what makes it truly non-blocking
}

/**
 * Force flush all pending events (useful for testing or graceful shutdown)
 * This is async but should only be used in non-critical paths
 */
export async function flushAnalytics(): Promise<void> {
    if (batchTimer) {
        clearTimeout(batchTimer)
    }
    await processBatch()

    // Also flush the PostHog client if it exists
    if (posthogClient) {
        try {
            await posthogClient.shutdown()
        } catch (e) {
            console.error('Failed to shutdown PostHog:', e)
        }
    }
}

/**
 * Get current queue size (for monitoring/debugging)
 */
export function getQueueSize(): number {
    return eventQueue.length
}

/**
 * Backward compatibility: Keep the async version available too
 * for gradual migration of existing code
 */
export async function trackServerEvent(event: AnalyticsEvent): Promise<void> {
    trackServerEventAsync(event)
    // Don't await anything - return immediately
}
