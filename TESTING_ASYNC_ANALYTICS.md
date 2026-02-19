# Testing Guide: Async PostHog Analytics

## Quick Start

```bash
# Run all analytics tests
npm run test -- analytics

# Run specific test suites
npm run test -- analytics-async.test.ts           # Unit tests
npm run test -- generate-story-async.integration.test.ts  # Integration tests

# Run with coverage
npm run test -- --coverage analytics-async
```

## Test Suites

### 1. Unit Tests: `src/lib/analytics-async.test.ts`

**What:** Tests the async analytics wrapper in isolation

**Tests:**
- ✅ Non-blocking event queueing (<10ms)
- ✅ Queue accumulation
- ✅ Event properties preservation
- ✅ Error handling and fallback
- ✅ Batch flushing
- ✅ Concurrent event handling
- ✅ Event ordering

**Run:**
```bash
npm run test -- analytics-async.test.ts
```

**Expected Output:**
```
 PASS  src/lib/analytics-async.test.ts
  ✓ should queue events without blocking (5ms)
  ✓ should track multiple events in queue
  ✓ should handle events with no properties
  ✓ should flush all queued events
  ✓ should handle errors gracefully
  ✓ should batch events efficiently
  ✓ should include environment data
  ✓ should handle concurrent event tracking
  ✓ should maintain event order
  ✓ should not block on trackServerEvent sync version

Tests: 10 passed
```

### 2. Integration Tests: `src/app/actions/generate-story-async.integration.test.ts`

**What:** Tests async analytics in story generation flow

**Tests:**
- ✅ Story generation without analytics blocking
- ✅ Analytics failure doesn't break story generation
- ✅ Events are queued (not synchronous)
- ✅ User-facing response is fast
- ✅ Event properties are correct

**Run:**
```bash
npm run test -- generate-story-async.integration.test.ts
```

**Expected Output:**
```
 PASS  src/app/actions/generate-story-async.integration.test.ts
  ✓ should generate story without waiting for analytics
  ✓ should handle analytics failure without breaking story generation
  ✓ should queue analytics events (not synchronous)
  ✓ should not block user-facing response on analytics
  ✓ should include proper event properties

Tests: 5 passed
```

## Manual Testing

### Test 1: Verify Events are Queued Instantly

**Setup:**
```typescript
// In a test environment
import { trackServerEventAsync, getQueueSize } from '@/lib/analytics-async'

console.time('queue')
trackServerEventAsync({
    userId: 'test-user',
    event: 'test_event',
    properties: { test: true }
})
console.timeEnd('queue')

console.log(`Queue size: ${getQueueSize()}`)
```

**Expected:**
- ⏱️ Time < 1ms
- 📊 Queue size: 1

### Test 2: Verify Story Generation Latency

**Setup:**
```bash
# Check current performance baseline
npm run dev

# Navigate to story generation
# Open DevTools → Performance tab
# Generate a story
# Check network timing
```

**Measurement Points:**
- Story generation action duration
- Network request time to PostHog (should NOT be in critical path)

**Expected:**
- Story generation: <2 seconds
- PostHog network calls: Batched in background

### Test 3: Verify Batch Processing

**Setup:**
```typescript
import { trackServerEventAsync, flushAnalytics, getQueueSize } from '@/lib/analytics-async'

// Queue 5 events
for (let i = 0; i < 5; i++) {
    trackServerEventAsync({
        userId: 'user-1',
        event: `batch_test_${i}`
    })
}

console.log(`Queue before flush: ${getQueueSize()}`) // Should be 5

await flushAnalytics()

console.log(`Queue after flush: ${getQueueSize()}`) // Should be 0
```

**Expected:**
- Queue fills up
- After flush, queue is empty
- Events processed in batch

### Test 4: Verify Monitoring

**Setup:**
```typescript
import { 
    getAnalyticsMonitor,
    getAnalyticsHealth,
    logAnalyticsReport 
} from '@/lib/analytics-monitoring'

// Queue some events
for (let i = 0; i < 3; i++) {
    trackServerEventAsync({
        userId: 'user-1',
        event: `monitoring_test_${i}`
    })
}

// Check health
const health = getAnalyticsHealth()
console.log(`Status: ${health.status}`)
console.log(`Message: ${health.message}`)

// Log full report
logAnalyticsReport()
```

**Expected:**
- Health status: "healthy"
- Metrics show queued events
- Report shows proper counts

### Test 5: Error Handling

**Setup:**
```typescript
// Simulate missing PostHog key
process.env.NEXT_PUBLIC_POSTHOG_KEY = ''

trackServerEventAsync({
    userId: 'test-user',
    event: 'error_test'
})

// Should fall back to local logging
// Check console for: "📊 [Analytics Queue] Local fallback logging"
```

**Expected:**
- No crash
- Events logged locally
- Console shows fallback message

## Load Testing

### Scenario 1: Rapid Fire Events

```typescript
console.time('rapid-events')

for (let i = 0; i < 100; i++) {
    trackServerEventAsync({
        userId: `user-${i % 10}`,
        event: `rapid_test_${i}`,
        properties: { index: i }
    })
}

console.timeEnd('rapid-events')
console.log(`Final queue size: ${getQueueSize()}`)
```

**Expected:**
- Time: <50ms total
- Queue size: ~100 (or less if batching started)
- No performance degradation

### Scenario 2: Concurrent Requests

```typescript
const promises = []

for (let i = 0; i < 50; i++) {
    promises.push(
        Promise.resolve().then(() => {
            trackServerEventAsync({
                userId: `concurrent-${i}`,
                event: 'concurrent_test'
            })
        })
    )
}

await Promise.all(promises)
console.log(`Queue size: ${getQueueSize()}`) // Should be ~50
```

**Expected:**
- All events queued
- No race conditions
- Queue size accurate

## Production Testing

### Pre-Deployment Checklist

```bash
# 1. Run all tests
npm run test -- analytics

# 2. Build production version
npm run build

# 3. Check for errors
npm run lint

# 4. Verify no console errors
npm run dev  # then check browser console

# 5. Verify PostHog integration
# - Check Secret Manager has NEXT_PUBLIC_POSTHOG_KEY
# - Verify PostHog dashboard accessible
```

### Deployment Verification (Day 1)

**Timing:** Immediately after deployment

**Checks:**
```typescript
// Check 1: Verify async is working
import { getAnalyticsMonitor } from '@/lib/analytics-monitoring'
const monitor = getAnalyticsMonitor()

// Trigger some events (generate a story)
// Then check metrics
const metrics = monitor.getMetrics()
console.log('Metrics:', metrics)

// Expected: totalEventsQueued > 0, totalEventsProcessed > 0
```

**In PostHog Dashboard:**
- View event ingestion rate
- Should see story_generated, audio_generated, etc.
- Latency metrics unchanged from before

### Monitoring (Days 2-3)

**Check Twice Daily:**

1. **Morning Check:**
   ```bash
   # In production logs:
   # Look for: "📤 Sent N analytics events to PostHog (async, XXms)"
   # Count should be positive, time should be <200ms
   ```

2. **Evening Check:**
   ```bash
   # Run analytics report
   npm run analytics:report  # if available
   # Or check: getAnalyticsHealth() status
   ```

## Performance Benchmarks

### Expected Metrics (After Deployment)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Story generation time | 2.3-2.5s | <2.0s | 15-23% faster |
| Single event queue time | 300-500ms | <1ms | ~300x faster |
| PostHog response time | Blocks user | Background | Not visible |
| Event delivery rate | N/A | >99% | ✅ |
| Queue memory (100 events) | N/A | ~20KB | ✅ |

### Measurement Tools

**Use PostHog Insights:**
1. Create query for `story_generated` events
2. Graph: "Duration" or "Processing time"
3. Compare before/after deployment
4. Should show ~300-500ms reduction

**Use Browser DevTools:**
1. Open Performance tab
2. Generate a story
3. Compare action duration before/after
4. Should complete faster (story gen + response)

## Troubleshooting Tests

### Test Fails: "Queue not empty after flush"

**Cause:** Mock PostHog client not set up

**Fix:**
```typescript
// Ensure mocks are configured
vi.mock('posthog-node', () => ({
    PostHog: vi.fn(() => ({
        capture: vi.fn(),
        shutdown: vi.fn()
    }))
}))
```

### Test Fails: "Event not in queue"

**Cause:** Event was processed before assertion

**Fix:**
```typescript
// Don't await anything before checking queue
trackServerEventAsync(event)
// Check immediately, don't let time pass
expect(getQueueSize()).toBeGreaterThan(0)
```

### Test Times Out

**Cause:** Batch processing stuck

**Fix:**
```typescript
// Always clean up after tests
afterEach(async () => {
    await flushAnalytics()  // Force flush
})
```

## CI/CD Integration

### GitHub Actions / Firebase Hosting

```yaml
# Add to your CI pipeline
- name: Test Analytics
  run: npm run test -- analytics --coverage

- name: Check Coverage
  run: npm run test -- --coverage --coverageThreshold='{"lines": 80}'
```

### Expected CI Output

```
PASS  src/lib/analytics-async.test.ts
PASS  src/app/actions/generate-story-async.integration.test.ts

Coverage summary:
  Lines: 92% (89/97)
  Statements: 92% (89/97)
  Functions: 85% (17/20)
  Branches: 88% (22/25)
```

## Success Criteria

✅ All unit tests pass
✅ All integration tests pass
✅ No console errors
✅ Story generation latency reduced 300-500ms
✅ PostHog events delivered >99%
✅ No memory leaks
✅ Queue size stays <100 (steady state)
✅ Monitoring shows "healthy" status

## Questions?

Refer to:
- `docs/ANALYTICS_ASYNC_SYSTEM.md` - Technical architecture
- `ANALYTICS_MIGRATION.md` - Deployment guide
- Source code comments in `src/lib/analytics-async.ts`
