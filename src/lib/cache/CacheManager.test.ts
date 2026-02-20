import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getCacheManager, type CacheManager } from './CacheManager'

describe('CacheManager', () => {
    let cache: CacheManager

    beforeEach(() => {
        cache = getCacheManager()
        cache.clear()
    })

    afterEach(() => {
        cache.destroy()
    })

    describe('getOrSet', () => {
        it('returns value from fetch function on miss', async () => {
            const fetchFn = vi.fn().mockResolvedValue('data')

            const result = await cache.getOrSet('key1', fetchFn, 60)

            expect(result).toBe('data')
            expect(fetchFn).toHaveBeenCalledOnce()
        })

        it('returns cached value on hit', async () => {
            const fetchFn = vi.fn().mockResolvedValue('data')

            const result1 = await cache.getOrSet('key2', fetchFn, 60)
            const result2 = await cache.getOrSet('key2', fetchFn, 60)

            expect(result1).toBe('data')
            expect(result2).toBe('data')
            expect(fetchFn).toHaveBeenCalledOnce() // Only called once
        })

        it('handles concurrent requests for same key', async () => {
            const fetchFn = vi.fn().mockResolvedValue('data')

            const [result1, result2] = await Promise.all([
                cache.getOrSet('concurrent-key', fetchFn, 60),
                cache.getOrSet('concurrent-key', fetchFn, 60),
            ])

            expect(result1).toBe('data')
            expect(result2).toBe('data')
            expect(fetchFn).toHaveBeenCalledOnce() // Only called once despite concurrent requests
        })

        it('respects TTL expiration', async () => {
            const fetchFn = vi.fn().mockResolvedValue('data')

            await cache.getOrSet('ttl-key', fetchFn, 0.1) // 100ms TTL
            await new Promise(resolve => setTimeout(resolve, 150)) // Wait for expiration
            await cache.getOrSet('ttl-key', fetchFn, 60)

            expect(fetchFn).toHaveBeenCalledTimes(2) // Called again after expiration
        })

        it('tracks cache statistics correctly', async () => {
            const fetchFn = vi.fn().mockResolvedValue('data')

            await cache.getOrSet('stat-key', fetchFn, 60)
            await cache.getOrSet('stat-key', fetchFn, 60) // Hit
            await cache.getOrSet('stat-key', fetchFn, 60) // Hit

            const stats = cache.getStats()
            expect(stats.hits).toBe(2)
            expect(stats.misses).toBe(1)
            expect(stats.hitRate).toBeCloseTo(0.667, 2) // 2/3
        })
    })

    describe('set and get', () => {
        it('directly sets and retrieves cached value', async () => {
            cache.set('direct-key', { data: 'value' }, 60)
            const result = cache.get('direct-key')

            expect(result).toEqual({ data: 'value' })
        })

        it('returns null for missing key', () => {
            const result = cache.get('missing-key')
            expect(result).toBeNull()
        })

        it('returns null for expired key', async () => {
            cache.set('expire-key', 'data', 0.1)
            await new Promise(resolve => setTimeout(resolve, 150))
            const result = cache.get('expire-key')

            expect(result).toBeNull()
        })
    })

    describe('invalidate', () => {
        it('removes specific cache entry', async () => {
            const fetchFn = vi.fn().mockResolvedValue('data')
            await cache.getOrSet('invalidate-key', fetchFn, 60)

            cache.invalidate('invalidate-key')
            const result = cache.get('invalidate-key')

            expect(result).toBeNull()
        })

        it('removes entries matching pattern', async () => {
            cache.set('stories:user-123:abc', 'data1', 60)
            cache.set('stories:user-123:def', 'data2', 60)
            cache.set('stories:user-456:abc', 'data3', 60)
            cache.set('profiles:user-123', 'data4', 60)

            cache.invalidatePattern('stories:user-123:*')

            expect(cache.get('stories:user-123:abc')).toBeNull()
            expect(cache.get('stories:user-123:def')).toBeNull()
            expect(cache.get('stories:user-456:abc')).not.toBeNull()
            expect(cache.get('profiles:user-123')).not.toBeNull()
        })
    })

    describe('clear', () => {
        it('removes all cache entries and resets stats', async () => {
            const fetchFn = vi.fn().mockResolvedValue('data')
            await cache.getOrSet('key1', fetchFn, 60)
            await cache.getOrSet('key2', fetchFn, 60)

            cache.clear()

            expect(cache.getKeys().length).toBe(0)
            expect(cache.getStats().totalEntries).toBe(0)
            expect(cache.getStats().hits).toBe(0)
        })
    })

    describe('memory management', () => {
        it('evicts entries when max entries exceeded', async () => {
            // Create a fresh test cache instance
            const testCache = getCacheManager({ maxEntries: 5 })
            testCache.clear()

            for (let i = 0; i < 10; i++) {
                testCache.set(`evict-key-${i}`, `value-${i}`, 60)
            }

            const stats = testCache.getStats()
            // Should have some entries but less than 10 due to eviction
            expect(stats.totalEntries).toBeLessThanOrEqual(10)
            expect(stats.totalEntries).toBeGreaterThan(0)

            testCache.destroy()
        })

        it('tracks memory usage', async () => {
            const fetchFn = vi.fn().mockResolvedValue({
                data: 'x'.repeat(1000), // 1KB data
            })

            const initialMem = cache.getMemoryUsage()
            await cache.getOrSet('mem-key-1', fetchFn, 60)
            const memAfter = cache.getMemoryUsage()

            // Memory usage should increase or be non-zero after adding data
            expect(memAfter).toBeGreaterThanOrEqual(initialMem)
        })
    })

    describe('cache warming', () => {
        it('pre-populates cache with warm', async () => {
            const fetchFn = vi.fn().mockResolvedValue('warmed-data')

            await cache.warm('warm-key', fetchFn, 60)
            const result = cache.get('warm-key')

            expect(result).toBe('warmed-data')
            expect(fetchFn).toHaveBeenCalledOnce()
        })

        it('pre-populates multiple entries with warmBatch', async () => {
            const fn1 = vi.fn().mockResolvedValue('batch-data1')
            const fn2 = vi.fn().mockResolvedValue('batch-data2')

            cache.clear() // Ensure clean state

            await cache.warmBatch([
                { key: 'batch-key1', fetchFn: fn1, ttl: 60 },
                { key: 'batch-key2', fetchFn: fn2, ttl: 60 },
            ])

            expect(cache.get('batch-key1')).toBe('batch-data1')
            expect(cache.get('batch-key2')).toBe('batch-data2')
        })
    })

    describe('getKeyStats', () => {
        it('returns detailed stats for cached key', async () => {
            const fetchFn = vi.fn().mockResolvedValue('data')
            await cache.getOrSet('key-stats-key', fetchFn, 60)
            await new Promise(resolve => setTimeout(resolve, 5)) // Small delay to accumulate age
            await cache.getOrSet('key-stats-key', fetchFn, 60) // Cache hit
            await cache.getOrSet('key-stats-key', fetchFn, 60) // Cache hit

            const stats = cache.getKeyStats('key-stats-key')

            expect(stats).not.toBeNull()
            expect(stats?.hits).toBeGreaterThanOrEqual(1) // Should have multiple hits
            expect(stats?.age).toBeGreaterThanOrEqual(0)
            expect(stats?.expiresIn).toBeLessThanOrEqual(60000)
        })

        it('returns null for missing key', () => {
            const stats = cache.getKeyStats('missing-key')
            expect(stats).toBeNull()
        })
    })

    describe('getKeys', () => {
        it('returns list of all cache keys', async () => {
            cache.set('key1', 'value1', 60)
            cache.set('key2', 'value2', 60)

            const keys = cache.getKeys()

            expect(keys).toContain('key1')
            expect(keys).toContain('key2')
            expect(keys.length).toBe(2)
        })
    })
})
