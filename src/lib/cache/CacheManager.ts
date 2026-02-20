/**
 * CacheManager - High-performance in-memory cache with TTL support
 * 
 * Features:
 * - Generic key-value caching
 * - TTL (Time-To-Live) expiration
 * - Cache statistics tracking
 * - Namespace support
 * - Automatic cleanup of expired entries
 * - Request deduplication for concurrent calls
 * 
 * Usage:
 *   const cache = getCacheManager()
 *   const data = await cache.getOrSet('key', fetchDataFn, 300) // 5 min TTL
 */

interface CacheEntry<T> {
    value: T
    expiresAt: number
    hits: number
    createdAt: number
}

interface CacheStats {
    hits: number
    misses: number
    evictions: number
    memoryUsage: number
    totalEntries: number
    hitRate: number
}

interface CacheOptions {
    maxEntries?: number
    maxMemoryMB?: number
    cleanupInterval?: number
}

class CacheManager {
    private static instance: CacheManager
    private cache: Map<string, CacheEntry<any>> = new Map()
    private stats: CacheStats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        memoryUsage: 0,
        totalEntries: 0,
        hitRate: 0,
    }
    private options: Required<CacheOptions>
    private cleanupTimer: NodeJS.Timeout | null = null
    private pendingRequests: Map<string, Promise<any>> = new Map()

    private constructor(options: CacheOptions = {}) {
        this.options = {
            maxEntries: options.maxEntries ?? 10000,
            maxMemoryMB: options.maxMemoryMB ?? 200,
            cleanupInterval: options.cleanupInterval ?? 60000, // 1 minute
        }
        this.startCleanup()
    }

    static getInstance(options?: CacheOptions): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager(options)
        }
        return CacheManager.instance
    }

    /**
     * Get or set cache value with TTL
     * Handles concurrent requests for the same key by returning the same promise
     */
    async getOrSet<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttlSeconds: number = 300
    ): Promise<T> {
        // Check if value exists and is not expired
        const cached = this.cache.get(key)
        if (cached && cached.expiresAt > Date.now()) {
            cached.hits++
            this.stats.hits++
            return cached.value as T
        }

        // Handle concurrent requests for the same key
        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key)!
        }

        // Fetch and cache
        const promise = fetchFn().then((value) => {
            const expiresAt = Date.now() + ttlSeconds * 1000
            const entry: CacheEntry<T> = {
                value,
                expiresAt,
                hits: 1,
                createdAt: Date.now(),
            }

            this.cache.set(key, entry)
            this.stats.misses++
            this.stats.totalEntries = this.cache.size
            this.updateMemoryUsage()
            this.evictIfNeeded()

            // Clean up pending request after 100ms
            setTimeout(() => {
                this.pendingRequests.delete(key)
            }, 100)

            return value
        })

        this.pendingRequests.set(key, promise)
        return promise
    }

    /**
     * Direct cache set with optional TTL
     */
    set<T>(key: string, value: T, ttlSeconds: number = 300): void {
        const expiresAt = Date.now() + ttlSeconds * 1000
        const entry: CacheEntry<T> = {
            value,
            expiresAt,
            hits: 0,
            createdAt: Date.now(),
        }
        this.cache.set(key, entry)
        this.stats.totalEntries = this.cache.size
        this.updateMemoryUsage()
        this.evictIfNeeded()
    }

    /**
     * Get cached value without fallback
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key)
        if (!entry || entry.expiresAt <= Date.now()) {
            return null
        }
        entry.hits++
        this.stats.hits++
        return entry.value as T
    }

    /**
     * Remove specific cache entry
     */
    invalidate(key: string): void {
        this.cache.delete(key)
        this.stats.totalEntries = this.cache.size
    }

    /**
     * Invalidate cache entries matching a pattern
     * Example: invalidatePattern('stories:user-123:*')
     */
    invalidatePattern(pattern: string): void {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
        const keys = Array.from(this.cache.keys()).filter(k => regex.test(k))
        keys.forEach(k => this.cache.delete(k))
        this.stats.totalEntries = this.cache.size
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear()
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            memoryUsage: 0,
            totalEntries: 0,
            hitRate: 0,
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const total = this.stats.hits + this.stats.misses
        return {
            ...this.stats,
            hitRate: total > 0 ? Math.round((this.stats.hits / total) * 100) / 100 : 0,
        }
    }

    /**
     * Get detailed stats for specific key
     */
    getKeyStats(key: string): { hits: number; age: number; expiresIn: number } | null {
        const entry = this.cache.get(key)
        if (!entry) return null

        return {
            hits: entry.hits,
            age: Date.now() - entry.createdAt,
            expiresIn: Math.max(0, entry.expiresAt - Date.now()),
        }
    }

    /**
     * List all cache keys (for debugging)
     */
    getKeys(): string[] {
        return Array.from(this.cache.keys())
    }

    /**
     * Get cache size in bytes (approximation)
     */
    getMemoryUsage(): number {
        return this.stats.memoryUsage
    }

    /**
     * Enable cache warming
     * Pre-populate cache with expensive operations
     */
    async warm<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttlSeconds: number = 300
    ): Promise<void> {
        await this.getOrSet(key, fetchFn, ttlSeconds)
    }

    /**
     * Batch warm multiple cache entries
     */
    async warmBatch(entries: Array<{
        key: string
        fetchFn: () => Promise<any>
        ttl?: number
    }>): Promise<void> {
        await Promise.all(
            entries.map(({ key, fetchFn, ttl = 300 }) =>
                this.warm(key, fetchFn, ttl)
            )
        )
    }

    // Private methods

    private updateMemoryUsage(): void {
        let size = 0
        for (const entry of this.cache.values()) {
            size += JSON.stringify(entry).length
        }
        this.stats.memoryUsage = Math.round((size / (1024 * 1024)) * 100) / 100
    }

    private evictIfNeeded(): void {
        // Evict based on entry count
        if (this.cache.size > this.options.maxEntries) {
            this.evictByLRU()
        }

        // Evict based on memory usage
        if (this.stats.memoryUsage > this.options.maxMemoryMB) {
            this.evictByMemory()
        }
    }

    private evictByLRU(): void {
        // Remove entries with least hits first
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => a[1].hits - b[1].hits)

        const toRemove = Math.ceil(entries.length * 0.1) // Remove 10%
        for (let i = 0; i < toRemove; i++) {
            this.cache.delete(entries[i][0])
            this.stats.evictions++
        }
    }

    private evictByMemory(): void {
        // Remove oldest entries
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => a[1].createdAt - b[1].createdAt)

        const toRemove = Math.ceil(entries.length * 0.15) // Remove 15%
        for (let i = 0; i < toRemove; i++) {
            this.cache.delete(entries[i][0])
            this.stats.evictions++
        }
    }

    private startCleanup(): void {
        // Remove expired entries periodically
        this.cleanupTimer = setInterval(() => {
            const now = Date.now()
            let removed = 0

            for (const [key, entry] of this.cache.entries()) {
                if (entry.expiresAt <= now) {
                    this.cache.delete(key)
                    removed++
                }
            }

            if (removed > 0) {
                this.stats.totalEntries = this.cache.size
                this.updateMemoryUsage()
            }
        }, this.options.cleanupInterval)

        // Prevent timer from keeping process alive
        if (this.cleanupTimer.unref) {
            this.cleanupTimer.unref()
        }
    }

    /**
     * Shutdown cache cleanup
     */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer)
        }
        this.clear()
    }
}

// Export singleton getter
export function getCacheManager(options?: CacheOptions): CacheManager {
    return CacheManager.getInstance(options)
}

export type { CacheStats, CacheOptions }
