/**
 * Cache Load Testing Utilities
 * 
 * Simulates realistic workloads to measure cache performance
 */

import { getCacheManager } from './CacheManager'
import { getCacheMonitor } from './monitoring'

interface LoadTestConfig {
    concurrentUsers?: number
    requestsPerUser?: number
    storyFetchRatio?: number // Ratio of story fetches vs other operations
    cacheDuration?: number // How long to run the test (ms)
    verbose?: boolean
}

interface LoadTestResults {
    duration: number
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageResponseTime: number
    minResponseTime: number
    maxResponseTime: number
    cacheHitRate: number
    peakMemoryUsage: number
    avgMemoryUsage: number
}

class LoadTester {
    private config: Required<LoadTestConfig>

    constructor(config: LoadTestConfig = {}) {
        this.config = {
            concurrentUsers: config.concurrentUsers ?? 50,
            requestsPerUser: config.requestsPerUser ?? 10,
            storyFetchRatio: config.storyFetchRatio ?? 0.7,
            cacheDuration: config.cacheDuration ?? 30000, // 30 seconds
            verbose: config.verbose ?? false,
        }
    }

    /**
     * Run a cache hit rate load test
     * Simulates repeated cache accesses to measure hit rates
     */
    async testCacheHitRate(): Promise<LoadTestResults> {
        const cache = getCacheManager()
        const monitor = getCacheMonitor()

        if (this.config.verbose) {
            console.log(`\n🚀 Starting Cache Hit Rate Test`)
            console.log(
                `   Users: ${this.config.concurrentUsers}, Requests/user: ${this.config.requestsPerUser}`
            )
        }

        const startTime = Date.now()
        let successfulRequests = 0
        let failedRequests = 0
        const responseTimes: number[] = []
        const memorySnapshots: number[] = []

        // Simulate concurrent users
        const promises: Promise<void>[] = []

        for (let user = 0; user < this.config.concurrentUsers; user++) {
            promises.push(
                (async () => {
                    for (let req = 0; req < this.config.requestsPerUser; req++) {
                        const reqStart = Date.now()

                        try {
                            // 70% story fetches, 30% profile fetches
                            const isFetchStory = Math.random() < this.config.storyFetchRatio
                            const key = isFetchStory
                                ? `stories:user-${Math.floor(user / 5)}` // Overlap users
                                : `profiles:user-${Math.floor(user / 10)}`

                            // Try cache, or simulate fetch
                            const result = await cache.getOrSet(
                                key,
                                async () => {
                                    // Simulate some work
                                    await new Promise(resolve => setTimeout(resolve, Math.random() * 50))
                                    return { data: `result-${key}-${req}` }
                                },
                                300
                            )

                            successfulRequests++
                            responseTimes.push(Date.now() - reqStart)
                        } catch (error) {
                            failedRequests++
                        }

                        memorySnapshots.push(cache.getMemoryUsage())
                    }
                })()
            )
        }

        // Execute all promises concurrently
        await Promise.all(promises)

        const duration = Date.now() - startTime
        const stats = monitor.collectMetrics()

        const results: LoadTestResults = {
            duration,
            totalRequests: successfulRequests + failedRequests,
            successfulRequests,
            failedRequests,
            averageResponseTime: this.average(responseTimes),
            minResponseTime: Math.min(...responseTimes),
            maxResponseTime: Math.max(...responseTimes),
            cacheHitRate: stats.cache_hit_rate,
            peakMemoryUsage: Math.max(...memorySnapshots),
            avgMemoryUsage: this.average(memorySnapshots),
        }

        if (this.config.verbose) {
            this.printResults(results)
        }

        return results
    }

    /**
     * Run a memory stress test
     * Fills the cache to measure memory behavior under load
     */
    async testMemoryBehavior(): Promise<LoadTestResults> {
        const cache = getCacheManager()
        const monitor = getCacheMonitor()

        if (this.config.verbose) {
            console.log(`\n💾 Starting Memory Stress Test`)
        }

        const startTime = Date.now()
        let successfulRequests = 0
        let failedRequests = 0
        const responseTimes: number[] = []
        const memorySnapshots: number[] = []

        // Create many cache entries
        for (let i = 0; i < 1000; i++) {
            const reqStart = Date.now()

            try {
                await cache.getOrSet(
                    `memory-test:${i}`,
                    async () => {
                        return { data: 'x'.repeat(Math.random() * 1000) } // Variable size data
                    },
                    300
                )
                successfulRequests++
            } catch (error) {
                failedRequests++
            }

            responseTimes.push(Date.now() - reqStart)
            memorySnapshots.push(cache.getMemoryUsage())
        }

        const duration = Date.now() - startTime
        const stats = monitor.collectMetrics()

        const results: LoadTestResults = {
            duration,
            totalRequests: successfulRequests + failedRequests,
            successfulRequests,
            failedRequests,
            averageResponseTime: this.average(responseTimes),
            minResponseTime: Math.min(...responseTimes),
            maxResponseTime: Math.max(...responseTimes),
            cacheHitRate: stats.cache_hit_rate,
            peakMemoryUsage: Math.max(...memorySnapshots),
            avgMemoryUsage: this.average(memorySnapshots),
        }

        if (this.config.verbose) {
            this.printResults(results)
        }

        return results
    }

    /**
     * Run concurrent access test to find race conditions
     */
    async testConcurrentAccess(): Promise<LoadTestResults> {
        const cache = getCacheManager()
        const monitor = getCacheMonitor()

        if (this.config.verbose) {
            console.log(`\n🔀 Starting Concurrent Access Test`)
        }

        const startTime = Date.now()
        let successfulRequests = 0
        let failedRequests = 0
        const responseTimes: number[] = []

        const promises: Promise<void>[] = []

        // Simulate 100 concurrent users accessing the same keys
        for (let i = 0; i < 100; i++) {
            promises.push(
                (async () => {
                    for (let j = 0; j < 20; j++) {
                        const reqStart = Date.now()

                        try {
                            const result = await cache.getOrSet(
                                'concurrent:shared-key',
                                async () => {
                                    await new Promise(resolve => setTimeout(resolve, 10))
                                    return { timestamp: Date.now() }
                                },
                                60
                            )

                            successfulRequests++
                            responseTimes.push(Date.now() - reqStart)
                        } catch (error) {
                            failedRequests++
                        }
                    }
                })()
            )
        }

        await Promise.all(promises)

        const duration = Date.now() - startTime
        const stats = monitor.collectMetrics()

        const results: LoadTestResults = {
            duration,
            totalRequests: successfulRequests + failedRequests,
            successfulRequests,
            failedRequests,
            averageResponseTime: this.average(responseTimes),
            minResponseTime: Math.min(...responseTimes),
            maxResponseTime: Math.max(...responseTimes),
            cacheHitRate: stats.cache_hit_rate,
            peakMemoryUsage: stats.memoryUsage,
            avgMemoryUsage: stats.memoryUsage,
        }

        if (this.config.verbose) {
            this.printResults(results)
        }

        return results
    }

    /**
     * Run cache invalidation test
     */
    async testCacheInvalidation(): Promise<boolean> {
        const cache = getCacheManager()

        if (this.config.verbose) {
            console.log(`\n♻️  Starting Cache Invalidation Test`)
        }

        try {
            // Set some values
            cache.set('invalidate:test1', 'value1', 60)
            cache.set('invalidate:test2', 'value2', 60)
            cache.set('invalidate:test3', 'value3', 60)
            cache.set('other:test', 'value4', 60)

            // Verify they exist
            if (cache.get('invalidate:test1') === null) throw new Error('Value not cached')

            // Invalidate pattern
            cache.invalidatePattern('invalidate:*')

            // Verify invalidation
            if (
                cache.get('invalidate:test1') !== null ||
                cache.get('invalidate:test2') !== null ||
                cache.get('invalidate:test3') !== null
            ) {
                throw new Error('Pattern invalidation failed')
            }

            // Verify other key still exists
            if (cache.get('other:test') === null) {
                throw new Error('Unrelated key was invalidated')
            }

            if (this.config.verbose) {
                console.log('   ✅ Pattern invalidation test passed')
            }

            return true
        } catch (error) {
            if (this.config.verbose) {
                console.error('   ❌ Cache invalidation test failed:', error)
            }
            return false
        }
    }

    // Helper methods

    private average(numbers: number[]): number {
        if (numbers.length === 0) return 0
        return numbers.reduce((a, b) => a + b, 0) / numbers.length
    }

    private printResults(results: LoadTestResults): void {
        console.log(`
📊 Test Results
──────────────────────────────────────────
Duration:           ${results.duration}ms
Total Requests:     ${results.totalRequests}
Successful:         ${results.successfulRequests}
Failed:             ${results.failedRequests}
Avg Response Time:  ${results.averageResponseTime.toFixed(2)}ms
Min Response Time:  ${results.minResponseTime.toFixed(2)}ms
Max Response Time:  ${results.maxResponseTime.toFixed(2)}ms
Cache Hit Rate:     ${(results.cacheHitRate * 100).toFixed(1)}%
Peak Memory:        ${results.peakMemoryUsage.toFixed(2)}MB
Avg Memory:         ${results.avgMemoryUsage.toFixed(2)}MB
──────────────────────────────────────────
`)
    }
}

export function createLoadTester(config?: LoadTestConfig): LoadTester {
    return new LoadTester(config)
}

export type { LoadTestConfig, LoadTestResults }
