/**
 * Cache Monitoring & Metrics Collection
 * 
 * Tracks cache performance metrics for observability and optimization
 */

import { getCacheManager } from './CacheManager'

interface CacheMetrics {
    timestamp: number
    cache_hit_rate: number
    cache_miss_rate: number
    memory_usage_mb: number
    total_entries: number
    total_hits: number
    total_misses: number
    evictions: number
    story_cache_hit_rate?: number
    profile_cache_hit_rate?: number
    ai_generation_cache_hit_rate?: number
}

interface KeyMetrics {
    key: string
    hits: number
    age_ms: number
    expires_in_ms: number
}

class CacheMonitor {
    private static instance: CacheMonitor
    private metrics: CacheMetrics[] = []
    private maxMetricsHistory: number = 1000

    private constructor() {}

    static getInstance(): CacheMonitor {
        if (!CacheMonitor.instance) {
            CacheMonitor.instance = new CacheMonitor()
        }
        return CacheMonitor.instance
    }

    /**
     * Collect current cache metrics
     */
    collectMetrics(): CacheMetrics {
        const cache = getCacheManager()
        const stats = cache.getStats()

        const metrics: CacheMetrics = {
            timestamp: Date.now(),
            cache_hit_rate: stats.hitRate,
            cache_miss_rate: 1 - stats.hitRate,
            memory_usage_mb: stats.memoryUsage,
            total_entries: stats.totalEntries,
            total_hits: stats.hits,
            total_misses: stats.misses,
            evictions: stats.evictions,
        }

        // Calculate feature-specific metrics
        const storyMetrics = this.getFeatureMetrics('stories:')
        if (storyMetrics) {
            metrics.story_cache_hit_rate = storyMetrics.hitRate
        }

        const profileMetrics = this.getFeatureMetrics('profiles:')
        if (profileMetrics) {
            metrics.profile_cache_hit_rate = profileMetrics.hitRate
        }

        const aiMetrics = this.getFeatureMetrics('story:')
        if (aiMetrics) {
            metrics.ai_generation_cache_hit_rate = aiMetrics.hitRate
        }

        // Store in history (keep max length)
        this.metrics.push(metrics)
        if (this.metrics.length > this.maxMetricsHistory) {
            this.metrics.shift()
        }

        return metrics
    }

    /**
     * Get metrics for a specific feature (by key prefix)
     */
    private getFeatureMetrics(
        prefix: string
    ): { totalHits: number; totalAccess: number; hitRate: number } | null {
        const cache = getCacheManager()
        const keys = cache.getKeys().filter(k => k.startsWith(prefix))

        if (keys.length === 0) return null

        let totalHits = 0
        for (const key of keys) {
            const stats = cache.getKeyStats(key)
            if (stats) {
                totalHits += stats.hits
            }
        }

        // Estimate access count (hits + assumed misses based on hit pattern)
        const avgHits = keys.length > 0 ? totalHits / keys.length : 0
        const estimatedTotal = totalHits + Math.max(0, keys.length - totalHits / Math.max(1, avgHits))

        return {
            totalHits,
            totalAccess: Math.max(totalHits, Math.ceil(estimatedTotal)),
            hitRate: estimatedTotal > 0 ? totalHits / estimatedTotal : 0,
        }
    }

    /**
     * Get metrics for top N cache keys by usage
     */
    getTopKeys(n: number = 10): KeyMetrics[] {
        const cache = getCacheManager()
        const keys = cache.getKeys()

        const keyMetrics: KeyMetrics[] = []
        for (const key of keys) {
            const stats = cache.getKeyStats(key)
            if (stats) {
                keyMetrics.push({
                    key,
                    hits: stats.hits,
                    age_ms: stats.age,
                    expires_in_ms: stats.expiresIn,
                })
            }
        }

        // Sort by hits (descending) and return top N
        return keyMetrics
            .sort((a, b) => b.hits - a.hits)
            .slice(0, n)
    }

    /**
     * Get metrics history
     */
    getMetricsHistory(limit?: number): CacheMetrics[] {
        return limit ? this.metrics.slice(-limit) : this.metrics
    }

    /**
     * Clear metrics history
     */
    clearHistory(): void {
        this.metrics = []
    }

    /**
     * Check if cache is operating at expected efficiency
     */
    isHealthy(): {
        healthy: boolean
        issues: string[]
    } {
        const cache = getCacheManager()
        const stats = cache.getStats()
        const issues: string[] = []

        // Low hit rate warning
        if (stats.hits + stats.misses > 100 && stats.hitRate < 0.5) {
            issues.push(`Low cache hit rate: ${(stats.hitRate * 100).toFixed(1)}%`)
        }

        // High memory usage warning
        if (stats.memoryUsage > 200) {
            issues.push(`High memory usage: ${stats.memoryUsage.toFixed(1)}MB`)
        }

        // High eviction rate
        if (stats.evictions > stats.totalEntries * 0.2) {
            issues.push(`High eviction rate: ${stats.evictions} evictions`)
        }

        return {
            healthy: issues.length === 0,
            issues,
        }
    }

    /**
     * Generate a summary report
     */
    generateReport(): string {
        const cache = getCacheManager()
        const stats = cache.getStats()
        const health = this.isHealthy()
        const topKeys = this.getTopKeys(5)
        const currentMetrics = this.collectMetrics()

        let report = `
╔═══════════════════════════════════════════════════════════╗
║              CACHE PERFORMANCE REPORT                     ║
╚═══════════════════════════════════════════════════════════╝

📊 OVERALL STATISTICS
──────────────────────────────────────────────────────────
Cache Hit Rate:        ${(stats.hitRate * 100).toFixed(1)}%
Total Hits:            ${stats.hits}
Total Misses:          ${stats.misses}
Memory Usage:          ${stats.memoryUsage.toFixed(2)} MB
Total Entries:         ${stats.totalEntries}
Evictions:             ${stats.evictions}

📈 FEATURE METRICS
──────────────────────────────────────────────────────────
Stories Hit Rate:      ${(currentMetrics.story_cache_hit_rate ? currentMetrics.story_cache_hit_rate * 100 : 0).toFixed(1)}%
Profiles Hit Rate:     ${(currentMetrics.profile_cache_hit_rate ? currentMetrics.profile_cache_hit_rate * 100 : 0).toFixed(1)}%
AI Generation Hit Rate: ${(currentMetrics.ai_generation_cache_hit_rate ? currentMetrics.ai_generation_cache_hit_rate * 100 : 0).toFixed(1)}%

🔥 TOP CACHE KEYS
──────────────────────────────────────────────────────────
`

        topKeys.forEach((key, idx) => {
            report += `${idx + 1}. ${key.key}: ${key.hits} hits\n`
        })

        report += `
🏥 HEALTH STATUS
──────────────────────────────────────────────────────────
Status: ${health.healthy ? '✅ HEALTHY' : '⚠️  ISSUES DETECTED'}
${health.issues.length > 0 ? health.issues.map(issue => `⚠️  ${issue}`).join('\n') : ''}

═══════════════════════════════════════════════════════════
`

        return report
    }

    /**
     * Export metrics as JSON
     */
    exportMetrics(): {
        current: CacheMetrics
        history: CacheMetrics[]
        topKeys: KeyMetrics[]
    } {
        return {
            current: this.collectMetrics(),
            history: this.getMetricsHistory(),
            topKeys: this.getTopKeys(20),
        }
    }
}

export function getCacheMonitor(): CacheMonitor {
    return CacheMonitor.getInstance()
}

export type { CacheMetrics, KeyMetrics }
