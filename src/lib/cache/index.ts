/**
 * Cache Module - Central export point for all caching utilities
 */

export { getCacheManager, CacheManager } from './CacheManager'
export type { CacheStats, CacheOptions } from './CacheManager'

export { getCacheMonitor, CacheMonitor } from './monitoring'
export type { CacheMetrics, KeyMetrics } from './monitoring'

export { createLoadTester, LoadTester } from './load-test'
export type { LoadTestConfig, LoadTestResults } from './load-test'

// Re-exports for convenience
export { invalidateUserStoriesCache } from '@/app/actions/get-stories'
export { invalidateProfilesCache } from '@/lib/profiles'
