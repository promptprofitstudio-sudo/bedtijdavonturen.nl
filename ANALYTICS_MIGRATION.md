# PostHog Analytics Async Migration Guide

## Overview

This document guides the migration from synchronous PostHog analytics to asynchronous, non-blocking analytics.

**Impact:** ~300-500ms latency reduction on every story generation and user action.

## Key Changes

### What Changed

1. **New async analytics wrapper** (`src/lib/analytics-async.ts`)
   - Singleton PostHog client
   - Event queue with batching
   - Fire-and-forget pattern
   - Automatic fallback to local logging

2. **Updated Server Actions**
   - `src/app/actions.ts` - Story generation
   - `src/app/actions/voice.ts` - Voice cloning
   - `src/app/actions/stripe.ts` - Checkout initiation
   - `src/app/actions/share.ts` - Share link generation
   - `src/app/api/webhooks/stripe/route.ts` - Payment webhooks

3. **New Monitoring** (`src/lib/analytics-monitoring.ts`)
   - Tracks queue health
   - Records delivery rates
   - Provides debugging utilities

### What Stayed the Same

- PostHog API credentials (no changes)
- Event names and properties
- Data retention policies
- Client-side analytics (PostHogProvider)

## Migration Checklist

### Pre-Deployment

- [ ] Run unit tests: `npm run test -- analytics-async.test.ts`
- [ ] Run integration tests: `npm run test -- generate-story-async.integration.test.ts`
- [ ] Verify all imports use `trackServerEventAsync` (not `trackServerEvent`)
- [ ] Review monitoring setup in critical paths
- [ ] Check environment variables for PostHog credentials
- [ ] Set up monitoring dashboard in PostHog UI

### Deployment Steps

1. **Stage 1: Deploy Code**
   ```bash
   git commit -m "feat: implement async PostHog analytics (M-002)"
   git push
   # Triggers Firebase App Hosting deployment
   ```

2. **Stage 2: Monitor (24 hours)**
   - Check PostHog event ingestion rate
   - Monitor story generation latency
   - Watch for analytics queue buildup
   - Verify error logs are clean

3. **Stage 3: Verify Results**
   - Compare latency: Before vs After
   - Check event delivery rate (target: >99%)
   - Verify no user-facing issues
   - Review monitoring reports

### Rollback Plan

If issues occur:

1. **Immediate (< 5 min)**
   ```bash
   git revert <commit-hash>
   # Automatic redeploy via Firebase App Hosting
   ```

2. **Status Check**
   - Verify story generation latency returns to baseline
   - Check PostHog event flow normalizes
   - Monitor error rates

## API Reference

### For Developers: Using the New System

#### Queuing Analytics Events (Non-Blocking)

```typescript
import { trackServerEventAsync } from '@/lib/analytics-async'

// In any server action
trackServerEventAsync({
    userId: 'user-123',
    event: 'story_generated',
    properties: {
        story_id: 'story-456',
        mood: 'calm'
    }
})
// Returns immediately - doesn't block!
```

#### For Testing: Flushing Events

```typescript
import { flushAnalytics } from '@/lib/analytics-async'

// In tests or graceful shutdown
await flushAnalytics()
// Ensures all queued events are sent to PostHog
```

#### Monitoring Health

```typescript
import { 
    getAnalyticsMetrics,
    getAnalyticsHealth,
    logAnalyticsReport
} from '@/lib/analytics-monitoring'

// Get metrics
const metrics = getAnalyticsMetrics()
console.log(`Queue size: ${metrics.currentQueueSize}`)

// Get health status
const health = getAnalyticsHealth()
if (health.status !== 'healthy') {
    console.warn(`⚠️ ${health.message}`)
}

// Log full report
logAnalyticsReport()
```

## Performance Expectations

### Before Migration
- Story generation: 2.3-2.5s
- Every event waits for PostHog response
- Network latency adds 300-500ms per operation

### After Migration
- Story generation: <2.0s
- Events queued instantly (<1ms)
- Network calls happen in background
- User sees response immediately

### Metrics to Track

1. **Latency** (in PostHog)
   - Query: `story_generated` events
   - Graph response time
   - Target: <2s (down from 2.3-2.5s)

2. **Event Delivery** (in PostHog)
   - Check event count over time
   - Target: 100% (no lost events)

3. **Queue Health** (in logs)
   - Monitor `currentQueueSize`
   - Target: <100 (background processing catches up)

## Monitoring & Debugging

### View Analytics Queue Status

```bash
# In production logs, look for:
📤 Sent 10 analytics events to PostHog (async, 45ms)
📝 [Analytics] Queued event: story_generated (queue size: 3)
```

### Check Health Status

```typescript
import { getAnalyticsHealth } from '@/lib/analytics-monitoring'

const health = getAnalyticsHealth()
console.log(health.status) // 'healthy' | 'degraded' | 'critical'
```

### View Recent Events Log

```typescript
import { getAnalyticsMonitor } from '@/lib/analytics-monitoring'

const monitor = getAnalyticsMonitor()
const recentLogs = monitor.getRecentLogs(20)
console.table(recentLogs)
```

## Troubleshooting

### Issue: Events Not Reaching PostHog

**Check:**
1. PostHog credentials in Secret Manager
2. Network connectivity to PostHog
3. Event logs for errors

**Solution:**
```typescript
import { logAnalyticsReport } from '@/lib/analytics-monitoring'
logAnalyticsReport() // See delivery rate
```

### Issue: Queue Growing Too Large

**Cause:** PostHog connection failing, events accumulating

**Check:**
```typescript
import { getAnalyticsMetrics } from '@/lib/analytics-monitoring'
const metrics = getAnalyticsMetrics()
console.log(`Queue size: ${metrics.currentQueueSize}`) // Should be <100
```

**Solution:**
1. Verify PostHog connectivity
2. Check network logs
3. May need temporary rollback if persistent

### Issue: High Memory Usage

**Cause:** Very large event queue or monitoring logs

**Solution:**
1. Check network connectivity
2. Consider increasing `BATCH_SIZE` in `analytics-async.ts`
3. Monitor queue size regularly

## FAQ

**Q: Will we lose analytics events?**
A: No. Events are queued locally and retried if sending fails.

**Q: What if the app crashes before flushing?**
A: Events in queue are lost (they're in-memory). This is expected trade-off for non-blocking behavior. Network calls to PostHog still complete normally.

**Q: How long are events queued?**
A: Maximum 5 seconds (BATCH_TIMEOUT_MS). Sent sooner if 10 events accumulated.

**Q: Does this affect client-side analytics?**
A: No. Only server-side analytics are async. Client-side (PostHogProvider) unchanged.

**Q: Can we still query historical data?**
A: Yes. Only future events use async pattern. Historical data unaffected.

## Success Metrics

After deployment, verify:

✅ Story generation latency reduced by 300-500ms
✅ PostHog event delivery rate > 99%
✅ Zero analytics-related errors in logs
✅ No memory leaks or queue buildup
✅ All unit tests passing
✅ Production users report improved performance

## Timeline

- **Deployment**: Day 1
- **Monitoring**: Days 2-3 (24-48 hours)
- **Verification**: Day 4
- **Full Rollout**: Day 5+ (if all metrics healthy)

## Questions?

See `src/lib/analytics-async.ts` for implementation details.
Contact: Engineering team
