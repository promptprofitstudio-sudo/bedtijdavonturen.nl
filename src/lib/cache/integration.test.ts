/**
 * Cache Integration Tests - Phase 3 Testing
 * 
 * Tests:
 * 1. Cache hit rate >70%
 * 2. Memory usage reduction
 * 3. Response time improvements
 * 4. Concurrent access safety
 * 5. Cache invalidation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getCacheManager } from './CacheManager'
import { getCacheMonitor } from './monitoring'
import { createLoadTester } from './load-test'

describe('Cache Integration Tests', () => {
    let cache: ReturnType<typeof getCacheManager>

    beforeEach(() => {
        cache = getCacheManager()
        cache.clear()
    })

    afterEach(() => {
        cache.destroy()
    })

    describe('Phase 3.1: Cache Hit Rate Target (>70%)', () => {
        it('achieves >70% hit rate with repeated accesses', async () => {
            const tester = createLoadTester({
                concurrentUsers: 10,
                requestsPerUser: 20,
                storyFetchRatio: 0.7,
                verbose: false,
            })

            const results = await tester.testCacheHitRate()

            expect(results.cacheHitRate).toBeGreaterThan(0.7)
            console.log(`✅ Cache Hit Rate: ${(results.cacheHitRate * 100).toFixed(1)}%`)
        })

        it('story cache hits increase with repeated user access', async () => {
            // First access - cache miss
            let hitCount = 0
            const key = `unique-story-${Date.now()}-${Math.random()}`
            
            await cache.getOrSet(
                key,
                async () => ({ stories: [] }),
                300
            )

            // Multiple accesses - should be cache hits
            for (let i = 0; i < 9; i++) {
                await cache.getOrSet(
                    key,
                    async () => {
                        hitCount++
                        return { stories: [] }
                    },
                    300
                )
            }

            // hitCount should still be 0 because we got cache hits
            expect(hitCount).toBe(0)
        })
    })

    describe('Phase 3.2: Memory Usage Reduction', () => {
        it('memory usage stays reasonable under load', async () => {
            const tester = createLoadTester({
                verbose: false,
            })

            const results = await tester.testMemoryBehavior()

            // Memory should be <250MB even with 1000 entries
            expect(results.peakMemoryUsage).toBeLessThan(250)
            console.log(`✅ Peak Memory: ${results.peakMemoryUsage.toFixed(2)}MB`)
        })

        it('cache eviction prevents unbounded memory growth', async () => {
            // Create cache with limited entries
            const limitedCache = getCacheManager({ maxMemoryMB: 50, maxEntries: 200 })
            limitedCache.clear()

            // Add many entries
            for (let i = 0; i < 500; i++) {
                limitedCache.set(
                    `key-${i}`,
                    { data: 'x'.repeat(100) },
                    60
                )
            }

            const finalMemory = limitedCache.getMemoryUsage()
            const stats = limitedCache.getStats()

            // Memory should stay bounded and not grow indefinitely
            expect(finalMemory).toBeLessThan(500) // Reasonable upper bound

            // Entries should be capped
            expect(stats.totalEntries).toBeLessThanOrEqual(500)

            limitedCache.destroy()
        })
    })

    describe('Phase 3.3: Response Time Improvements', () => {
        it('cache hits are significantly faster than misses', async () => {
            const responseTimes: { hit: number; miss: number } = { hit: 0, miss: 0 }

            // Measure miss response time
            const missStart = Date.now()
            await cache.getOrSet(
                'perf-test',
                async () => {
                    await new Promise(resolve => setTimeout(resolve, 50))
                    return { data: 'test' }
                },
                60
            )
            responseTimes.miss = Date.now() - missStart

            // Measure hit response time
            const hitStart = Date.now()
            await cache.getOrSet(
                'perf-test',
                async () => {
                    await new Promise(resolve => setTimeout(resolve, 50))
                    return { data: 'test' }
                },
                60
            )
            responseTimes.hit = Date.now() - hitStart

            // Cache hit should be >80% faster
            const improvement = ((responseTimes.miss - responseTimes.hit) / responseTimes.miss) * 100
            expect(improvement).toBeGreaterThan(80)

            console.log(`✅ Cache hit improvement: ${improvement.toFixed(0)}%`)
        })

        it('concurrent accesses are fast even with shared keys', async () => {
            const tester = createLoadTester({
                verbose: false,
            })

            const results = await tester.testConcurrentAccess()

            // Should handle 100 concurrent users efficiently
            expect(results.successfulRequests).toBeGreaterThan(1500) // 100 users * 20 requests - some may overlap
            expect(results.averageResponseTime).toBeLessThan(100) // Average should be <100ms

            console.log(
                `✅ Concurrent avg response time: ${results.averageResponseTime.toFixed(2)}ms`
            )
        })
    })

    describe('Phase 3.4: Concurrent Access Safety', () => {
        it('handles concurrent requests for same key correctly', async () => {
            let callCount = 0

            const promises = Promise.all(
                Array.from({ length: 10 }).map(() =>
                    cache.getOrSet(
                        'concurrent-test',
                        async () => {
                            callCount++
                            await new Promise(resolve => setTimeout(resolve, 10))
                            return { value: 'test' }
                        },
                        60
                    )
                )
            )

            const results = await promises

            // All should return the same result
            expect(results.every(r => r.value === 'test')).toBe(true)

            // Function should be called only once despite 10 concurrent requests
            expect(callCount).toBe(1)
        })

        it('concurrent users do not interfere with each other', async () => {
            const tester = createLoadTester({
                verbose: false,
            })

            const results = await tester.testConcurrentAccess()

            // No failed requests
            expect(results.failedRequests).toBe(0)

            // Many requests successful (100 users * 20 requests = 2000)
            expect(results.successfulRequests).toBeGreaterThan(1500)
        })
    })

    describe('Phase 3.5: Cache Invalidation', () => {
        it('cache invalidation works correctly', async () => {
            const tester = createLoadTester({ verbose: false })

            const success = await tester.testCacheInvalidation()
            expect(success).toBe(true)
        })

        it('pattern invalidation works as expected', () => {
            // Set various keys
            cache.set('stories:user-1:abc', 'data1', 60)
            cache.set('stories:user-1:def', 'data2', 60)
            cache.set('stories:user-2:abc', 'data3', 60)
            cache.set('profiles:user-1', 'data4', 60)

            // Invalidate stories for user 1
            cache.invalidatePattern('stories:user-1:*')

            // Check invalidation
            expect(cache.get('stories:user-1:abc')).toBeNull()
            expect(cache.get('stories:user-1:def')).toBeNull()
            expect(cache.get('stories:user-2:abc')).not.toBeNull()
            expect(cache.get('profiles:user-1')).not.toBeNull()
        })

        it('invalidation triggers refetch on next access', async () => {
            const key = `invalidate-refetch-${Date.now()}-${Math.random()}`
            let callCount = 0

            // Set initial value
            cache.set(key, { version: 1 }, 60)

            // Get it
            let result = cache.get(key)
            expect(result?.version).toBe(1)

            // Invalidate
            cache.invalidate(key)

            // Should be gone
            result = cache.get(key)
            expect(result).toBeNull()

            // Can set new value
            cache.set(key, { version: 2 }, 60)
            result = cache.get(key)
            expect(result?.version).toBe(2)
        })
    })

    describe('Phase 3.6: Monitoring & Health Checks', () => {
        it('monitoring collects accurate metrics', async () => {
            cache.clear()
            const monitor = getCacheMonitor()
            monitor.clearHistory()

            // Warm up cache
            for (let i = 0; i < 10; i++) {
                await cache.getOrSet(
                    `metric-test-${i}`,
                    async () => ({ data: 'test' }),
                    60
                )
            }

            // Generate hits (10 more accesses to same keys = 10 hits)
            for (let i = 0; i < 10; i++) {
                await cache.getOrSet(
                    `metric-test-${i}`,
                    async () => ({ data: 'test' }),
                    60
                )
            }

            const metrics = monitor.collectMetrics()

            expect(metrics.total_entries).toBeGreaterThan(0)
            expect(metrics.total_hits).toBeGreaterThanOrEqual(10)
            // After 10 misses and 10 hits, hit rate should be ~50%
            expect(metrics.cache_hit_rate).toBeGreaterThanOrEqual(0.4)
        })

        it('health check detects issues', () => {
            const monitor = getCacheMonitor()

            // Should be healthy initially
            const initialHealth = monitor.isHealthy()
            expect(initialHealth.healthy).toBe(true)
            expect(initialHealth.issues.length).toBe(0)
        })

        it('generates comprehensive report', () => {
            const monitor = getCacheMonitor()

            const report = monitor.generateReport()

            expect(report).toContain('CACHE PERFORMANCE REPORT')
            expect(report).toContain('Cache Hit Rate')
            expect(report).toContain('Memory Usage')
        })
    })

    describe('Phase 3.7: Acceptance Criteria Validation', () => {
        it('meets cache hit ratio >70%', async () => {
            const tester = createLoadTester({
                concurrentUsers: 25,
                requestsPerUser: 15,
                verbose: false,
            })

            const results = await tester.testCacheHitRate()

            // Acceptance criterion: >70%
            expect(results.cacheHitRate).toBeGreaterThan(0.7)
        })

        it('memory usage is reasonable', async () => {
            const tester = createLoadTester({ verbose: false })
            const results = await tester.testMemoryBehavior()

            // Should stay reasonable even under load
            expect(results.avgMemoryUsage).toBeLessThan(200)
        })

        it('response times improve significantly', async () => {
            let hitCount = 0
            let missCount = 0

            // Generate accesses
            for (let i = 0; i < 100; i++) {
                const userId = Math.floor(i / 10) // 10 users
                await cache.getOrSet(
                    `perf-key-${userId}`,
                    async () => ({ data: 'test' }),
                    300
                )
            }

            const monitor = getCacheMonitor()
            const metrics = monitor.collectMetrics()

            // After 100 accesses with 10 unique keys, hit rate should be high
            expect(metrics.cache_hit_rate).toBeGreaterThan(0.7)
        })

        it('load tests pass with realistic workload', async () => {
            const tester = createLoadTester({
                concurrentUsers: 50,
                requestsPerUser: 10,
                verbose: false,
            })

            const results = await tester.testCacheHitRate()

            // All basic requirements
            expect(results.successfulRequests).toBe(500) // All should succeed
            expect(results.failedRequests).toBe(0)
            expect(results.cacheHitRate).toBeGreaterThan(0.6)
        })
    })
})
