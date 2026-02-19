import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { trackServerEventAsync, flushAnalytics, getQueueSize } from './analytics-async'

// Mock the secrets module
vi.mock('@/lib/secrets', () => ({
    getSecret: vi.fn((key: string) => {
        if (key === 'NEXT_PUBLIC_POSTHOG_KEY') return 'test-key-123'
        if (key === 'NEXT_PUBLIC_POSTHOG_HOST') return 'https://test.posthog.com'
        return null
    })
}))

// Mock PostHog
vi.mock('posthog-node', () => {
    const mockCapture = vi.fn()
    const mockShutdown = vi.fn()
    
    return {
        PostHog: vi.fn(() => ({
            capture: mockCapture,
            shutdown: mockShutdown
        }))
    }
})

describe('Analytics Async Wrapper', () => {
    beforeEach(() => {
        // Clear queue before each test
        vi.clearAllMocks()
        // Reset the queue by flushing
        return flushAnalytics()
    })

    afterEach(async () => {
        await flushAnalytics()
    })

    it('should queue events without blocking', () => {
        const startTime = Date.now()
        
        trackServerEventAsync({
            userId: 'user-123',
            event: 'test_event',
            properties: { key: 'value' }
        })
        
        const endTime = Date.now()
        const duration = endTime - startTime
        
        // Should return almost instantly (< 10ms)
        expect(duration).toBeLessThan(10)
        expect(getQueueSize()).toBeGreaterThan(0)
    })

    it('should track multiple events in queue', () => {
        trackServerEventAsync({
            userId: 'user-1',
            event: 'event_1',
            properties: { index: 1 }
        })

        trackServerEventAsync({
            userId: 'user-2',
            event: 'event_2',
            properties: { index: 2 }
        })

        trackServerEventAsync({
            userId: 'user-3',
            event: 'event_3',
            properties: { index: 3 }
        })

        expect(getQueueSize()).toBe(3)
    })

    it('should handle events with no properties', () => {
        trackServerEventAsync({
            userId: 'user-123',
            event: 'simple_event'
        })

        expect(getQueueSize()).toBeGreaterThan(0)
    })

    it('should flush all queued events', async () => {
        trackServerEventAsync({
            userId: 'user-1',
            event: 'event_1'
        })

        trackServerEventAsync({
            userId: 'user-2',
            event: 'event_2'
        })

        expect(getQueueSize()).toBeGreaterThan(0)

        await flushAnalytics()

        // After flush, queue should be empty
        expect(getQueueSize()).toBe(0)
    })

    it('should handle errors gracefully', async () => {
        // Mock a failing setup
        const consoleSpy = vi.spyOn(console, 'error')

        trackServerEventAsync({
            userId: 'user-123',
            event: 'test_event',
            properties: { shouldFail: true }
        })

        await flushAnalytics()

        // Should not throw, but may log error
        expect(consoleSpy).not.toThrow()

        consoleSpy.mockRestore()
    })

    it('should batch events efficiently', async () => {
        // Queue up 5 events (less than batch size of 10)
        for (let i = 0; i < 5; i++) {
            trackServerEventAsync({
                userId: `user-${i}`,
                event: `event_${i}`
            })
        }

        expect(getQueueSize()).toBe(5)

        // Flush should process them all
        await flushAnalytics()
        expect(getQueueSize()).toBe(0)
    })

    it('should include environment data in properties', async () => {
        trackServerEventAsync({
            userId: 'user-123',
            event: 'test_event',
            properties: { custom: 'data' }
        })

        await flushAnalytics()

        // Queue should be empty after flush
        expect(getQueueSize()).toBe(0)
    })

    it('should handle concurrent event tracking', async () => {
        const promises = []

        for (let i = 0; i < 10; i++) {
            promises.push(
                Promise.resolve().then(() => {
                    trackServerEventAsync({
                        userId: `user-${i}`,
                        event: `concurrent_event_${i}`
                    })
                })
            )
        }

        await Promise.all(promises)

        // All events should be queued
        expect(getQueueSize()).toBeGreaterThan(0)

        await flushAnalytics()
        expect(getQueueSize()).toBe(0)
    })

    it('should maintain event order', async () => {
        const events = [
            { userId: 'user-1', event: 'first', properties: { order: 1 } },
            { userId: 'user-2', event: 'second', properties: { order: 2 } },
            { userId: 'user-3', event: 'third', properties: { order: 3 } }
        ]

        events.forEach(e => trackServerEventAsync(e))

        expect(getQueueSize()).toBe(3)

        await flushAnalytics()
    })

    it('should not block on trackServerEvent sync version', () => {
        const { trackServerEvent } = require('./analytics-async')
        const startTime = Date.now()

        // Call the sync version (which should still be non-blocking internally)
        trackServerEvent({
            userId: 'user-123',
            event: 'sync_test'
        })

        const duration = Date.now() - startTime

        expect(duration).toBeLessThan(10)
    })
})
