# Async Analytics System - Technical Documentation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ User Action (Story Generation, etc.)                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ trackServerEventAsync(event)                            │
│ - Queue event instantly (<1ms)                          │
│ - Return immediately (NON-BLOCKING)                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Event Queue (in-memory array)                           │
│ - Holds 1-10+ events                                    │
│ - Timestamp on arrival                                  │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼ (if queue >= 10)   ▼ (or after 5 sec)
   Process Immediately    Schedule Batch
        │                     │
        └──────────┬──────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ processBatch() - Background Task                        │
│ - Collect all queued events                             │
│ - Send to PostHog API                                   │
│ - Record metrics (success/failure)                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
          PostHog Cloud Service
```

## Component Details

### 1. Event Queue

**File:** `src/lib/analytics-async.ts`

**Behavior:**
- In-memory array: `eventQueue[]`
- Stores events with timestamp
- Grows until batch processing

**Limits:**
- No hard limit on queue size (memory-constrained)
- Batching starts at 10 events
- Timeout flush after 5 seconds

**Code:**
```typescript
type QueuedEvent = AnalyticsEvent & {
    timestamp: number
}

let eventQueue: QueuedEvent[] = []
```

### 2. Batch Processing

**Trigger Conditions:**
1. Queue reaches 10 events (BATCH_SIZE)
2. 5 seconds elapsed since last batch
3. Manual flush via `flushAnalytics()`

**Processing Steps:**
1. Get all events from queue
2. Clear queue for new events
3. Get PostHog client (lazy init)
4. Send batch via `client.capture()`
5. Record metrics
6. Handle errors (retry up to 5 events)

**Code:**
```typescript
const BATCH_SIZE = 10
const BATCH_TIMEOUT_MS = 5000

async function processBatch() {
    // ... see source for full implementation
}
```

### 3. PostHog Client (Singleton)

**Pattern:** Lazy initialization, reuse

**Benefits:**
- Single client instance across app
- Connection pooling
- Reduced memory usage
- Automatic retry/buffering in PostHog SDK

**Code:**
```typescript
let posthogClient: any = null

async function getPostHogClient() {
    if (posthogClient) return posthogClient
    
    const { PostHog } = await import('posthog-node')
    // ... initialize and return
}
```

### 4. Error Handling

**Levels:**
1. **Queue Level:** Try-catch in `trackServerEventAsync()`
2. **Batch Level:** Try-catch in `processBatch()`
3. **Client Level:** PostHog SDK handles retries

**Fallback Behavior:**
- No PostHog key → Local logging only
- PostHog unavailable → Log to console, retry up to 5 events
- Network error → Queue persists, retried next batch

**Code:**
```typescript
if (!client) {
    // Fallback: Local logging only
    console.log('📊 [Analytics Queue] Local fallback logging:', ...)
    return
}
```

### 5. Monitoring Integration

**File:** `src/lib/analytics-monitoring.ts`

**Metrics Tracked:**
- Total events queued
- Total events processed
- Total events failed
- Current queue size
- Average processing time
- Delivery rate (%)
- Failure rate (%)

**Health Status:**
- **Healthy:** >99% delivery, <1% failure, queue <100
- **Degraded:** >95% delivery, <5% failure, queue <500
- **Critical:** <95% delivery, queue >500

**Usage:**
```typescript
import { getAnalyticsMonitor } from '@/lib/analytics-monitoring'

const monitor = getAnalyticsMonitor()
monitor.recordEventQueued(event, userId)
monitor.recordEventProcessed(event, userId, duration)
monitor.recordEventFailed(event, userId, error)
```

## Data Flow Examples

### Example 1: Single Story Generation

```
1. User clicks "Generate Story"
2. generateStoryAction() starts
3. Generate story text (AI) - 2 seconds
4. Save to Firebase - 100ms
5. Call trackServerEventAsync() - <1ms
   → Returns immediately, doesn't wait!
6. Return response to user - NO DELAY
   → User sees story in ~2 seconds

Meanwhile (in background):
7. Event sits in queue for up to 5 seconds
8. processBatch() sends to PostHog
9. Event recorded in PostHog (delayed, not user-facing)
```

### Example 2: Batch of 10+ Events

```
1. Rapid user actions (5 events per second)
2. Events queue up: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
3. At 10 events → processBatch() triggered immediately
4. All 10 events sent to PostHog at once
5. More events keep arriving, queue building
6. Another 10 queued → processBatch() again
7. Efficient batching = lower bandwidth
```

### Example 3: Network Failure

```
1. PostHog service unavailable
2. trackServerEventAsync() queues events (works)
3. processBatch() tries to send (fails)
4. First 5 events put back in queue
5. Next batch attempt in 5 seconds
6. Eventually succeeds when network recovers
7. User never affected (events were already returned)
```

## Testing Strategy

### Unit Tests

**File:** `src/lib/analytics-async.test.ts`

**Coverage:**
- Event queuing (non-blocking)
- Queue accumulation
- Batch processing
- Error handling
- Flush functionality

**Run:**
```bash
npm run test -- analytics-async.test.ts
```

### Integration Tests

**File:** `src/app/actions/generate-story-async.integration.test.ts`

**Coverage:**
- Story generation with analytics
- Latency measurements
- Analytics queue status
- Error scenarios
- Event properties

**Run:**
```bash
npm run test -- generate-story-async.integration.test.ts
```

### Latency Benchmarks

**File:** `src/lib/analytics-latency.benchmark.ts`

**Comparison:**
- Old blocking pattern: ~300ms per event
- New async pattern: <1ms per event
- ~300x faster

**Run:**
```typescript
import { runBenchmarks } from '@/lib/analytics-latency.benchmark'
await runBenchmarks()
```

## Configuration

### Batch Size

**Current:** 10 events per batch

**Adjust in `src/lib/analytics-async.ts`:**
```typescript
const BATCH_SIZE = 10 // increase for slower services
```

**Trade-offs:**
- Smaller = more frequent API calls, lower latency
- Larger = fewer API calls, higher throughput

### Batch Timeout

**Current:** 5000ms (5 seconds)

**Adjust in `src/lib/analytics-async.ts`:**
```typescript
const BATCH_TIMEOUT_MS = 5000 // seconds to wait for batch
```

**Trade-offs:**
- Shorter = fresher data in PostHog
- Longer = more batching efficiency

### PostHog Client Options

**File:** `src/lib/analytics-async.ts` → `getPostHogClient()`

**Current:**
```typescript
posthogClient = new PostHog(phKey, { 
    host: phHost,
    flushAt: BATCH_SIZE,
    flushInterval: BATCH_TIMEOUT_MS,
    disabled: false
})
```

## Performance Characteristics

### Memory Usage

**Per Event:** ~200 bytes (object + metadata)
**Queue of 100:** ~20 KB
**Queue of 1000:** ~200 KB

**Monitoring:** Check `getQueueSize()` regularly

### CPU Impact

**Queuing:** Negligible (<0.1ms)
**Batch Processing:** ~10-50ms per 100 events
**Background:** Non-blocking

### Network Usage

**Per Event:** ~500 bytes (average)
**Batch of 10:** ~5 KB
**Per Day (1000 events):** ~500 KB

## Troubleshooting Guide

### High Queue Size

**Indicator:** `getAnalyticsMetrics().currentQueueSize > 500`

**Causes:**
- PostHog service slow/unavailable
- Network latency
- Too many events

**Solutions:**
1. Check PostHog status
2. Verify network connectivity
3. Consider increasing `BATCH_SIZE`
4. Review event volume

### Low Delivery Rate

**Indicator:** `getAnalyticsMetrics().deliveryRate < 95%`

**Causes:**
- PostHog connection failing
- Invalid credentials
- Rate limiting

**Solutions:**
1. Verify PostHog API key
2. Check rate limiting
3. Review error logs
4. Consider temporary rollback

### Memory Leaks

**Indicator:** Node memory grows over time

**Causes:**
- Queue growing unbounded
- Monitoring logs not trimmed
- Failed batch recovery loop

**Solutions:**
1. Check queue size
2. Review error patterns
3. Monitor processing times
4. May need code review

## Advanced Patterns

### Custom Event Properties

```typescript
trackServerEventAsync({
    userId: 'user-123',
    event: 'custom_action',
    properties: {
        custom_field: 'value',
        timestamp_ms: Date.now(),
        nested: { data: 'here' }
    }
})

// Properties are automatically enriched with:
// - app_version: '2.0.0'
// - environment: 'production' | 'development'
// - queued_at: ISO timestamp
```

### Conditional Batching

```typescript
// Skip analytics for test users
if (userId.startsWith('test-')) {
    return
}

trackServerEventAsync({
    userId,
    event: 'story_generated'
})
```

### Manual Flush (Testing)

```typescript
import { flushAnalytics } from '@/lib/analytics-async'

// In tests
await generateStory()
await flushAnalytics() // Ensure events sent
// Now safe to check PostHog
```

## Migration Path

### From Old System

**Old:**
```typescript
const { trackServerEvent } = await import('@/lib/server-analytics')
await trackServerEvent({ userId, event, properties })
```

**New:**
```typescript
const { trackServerEventAsync } = await import('@/lib/analytics-async')
trackServerEventAsync({ userId, event, properties })
// Don't await - fire and forget!
```

### Deprecation Timeline

- **Week 1:** New system deployed alongside old
- **Week 2:** Migrate all high-traffic endpoints
- **Week 3:** Migrate remaining code
- **Week 4:** Remove old `trackServerEvent` from `server-analytics.ts`

## References

- PostHog SDK: https://posthog.com/docs/libraries/node
- TypeScript: https://www.typescriptlang.org/
- Next.js Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions

## Support

Questions? Issues?

1. Check this documentation
2. Review source code comments
3. Check monitoring dashboards
4. Review recent commits
5. Contact engineering team
