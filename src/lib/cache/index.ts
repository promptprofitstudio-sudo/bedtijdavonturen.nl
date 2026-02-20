/**
 * Cache Module - Central export point for all caching utilities
 */

export { getCacheManager } from './CacheManager'
export type { CacheStats, CacheOptions } from './CacheManager'

export { getCacheMonitor } from './monitoring'
export type { CacheMetrics, KeyMetrics } from './monitoring'

export { createLoadTester } from './load-test'
export type { LoadTestConfig, LoadTestResults } from './load-test'

// Re-exports for convenience
// export { invalidateUserStoriesCache } from '@/app/actions/get-stories'
// export { invalidateProfilesCache } from '@/lib/profiles'
