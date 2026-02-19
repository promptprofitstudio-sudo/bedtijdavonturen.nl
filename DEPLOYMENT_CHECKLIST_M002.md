# Deployment Checklist - M-002: PostHog Async Analytics

**Epic:** SPRINT 1 - HIGH PRIORITY: Make PostHog Analytics Async  
**Task ID:** M-002  
**Priority:** HIGH (after M-001)  
**Timeline:** Week 1, Days 2-3  
**Impact:** 300-500ms latency reduction on story generation

---

## 📋 Pre-Deployment Phase

### Code Review Checklist
- [ ] All 6 modified action files reviewed
  - [ ] `src/app/actions.ts`
  - [ ] `src/app/actions/voice.ts`
  - [ ] `src/app/actions/audio.ts`
  - [ ] `src/app/actions/stripe.ts`
  - [ ] `src/app/actions/share.ts`
  - [ ] `src/app/api/webhooks/stripe/route.ts`
- [ ] No blocking `await client.shutdown()` calls remaining
- [ ] All `trackServerEventAsync` calls are non-blocking
- [ ] Error handling in place for all analytics calls
- [ ] Monitoring integration verified
- [ ] Type safety verified (no TypeScript errors)

### Testing Checklist
- [ ] Run: `npm run test -- analytics-async.test.ts`
  - Expected: 10/10 tests pass
- [ ] Run: `npm run test -- generate-story-async.integration.test.ts`
  - Expected: 5/5 tests pass
- [ ] Run: `npm run lint`
  - Expected: No errors or warnings
- [ ] Run: `npm run build`
  - Expected: Build succeeds, no errors
- [ ] Manual smoke test: Generate a story
  - Expected: Completes in <2 seconds

### Documentation Checklist
- [ ] `ANALYTICS_MIGRATION.md` reviewed and complete
- [ ] `TESTING_ASYNC_ANALYTICS.md` reviewed and complete
- [ ] `docs/ANALYTICS_ASYNC_SYSTEM.md` reviewed and complete
- [ ] `ASYNC_ANALYTICS_SUMMARY.md` reviewed and complete
- [ ] All code comments reviewed
- [ ] Team briefing scheduled

### Infrastructure Checklist
- [ ] PostHog credentials in Secret Manager
  - [ ] `NEXT_PUBLIC_POSTHOG_KEY` exists
  - [ ] `NEXT_PUBLIC_POSTHOG_HOST` set (if custom)
- [ ] PostHog account accessible
- [ ] Firebase App Hosting configured
- [ ] Logs accessible (Cloud Logging / Stackdriver)
- [ ] Monitoring dashboard ready

---

## 🚀 Deployment Phase

### Step 1: Final Code Verification
```bash
# 1. Verify no blocking calls remain
grep -r "await client.shutdown" src/app/actions

# Expected output: (empty - no matches)

# 2. Verify async calls in place
grep -r "trackServerEventAsync" src/app/actions

# Expected output: Multiple matches across 6 files
```

**Status:** ☐ Complete

### Step 2: Commit & Push
```bash
# 1. Review changes
git status

# 2. Add all changes
git add -A

# 3. Commit with clear message
git commit -m "feat: implement async PostHog analytics (M-002)

- Create async analytics wrapper with batching
- Update all 6 server actions to use fire-and-forget pattern
- Add monitoring system for queue health
- Eliminate 300-500ms blocking on every user action
- Target: <2s story generation (down from 2.3-2.5s)
- Expected impact: 15-23% latency improvement"

# 4. Push to main branch
git push origin main

# Expected: Firebase App Hosting auto-deploys
```

**Status:** ☐ Complete

### Step 3: Verify Deployment
```bash
# 1. Check Firebase App Hosting build
# - Navigate to Firebase Console
# - Go to App Hosting
# - Verify build starts and completes (5-10 min)
# - Check for deployment errors

# 2. Verify app is live
# - Open production URL
# - Check browser console for errors
# - Generate a test story
# - Should complete in <2 seconds
```

**Status:** ☐ Complete

---

## 📊 Monitoring Phase (24 Hours)

### Day 1: Immediate Verification (Hour 0-2)

**Check 1: Analytics Queue Health**
```
Location: Application logs (Cloud Logging)
Search: "📤 Sent.*analytics events to PostHog"

Expected: 
- Messages appearing frequently (every 5-10 seconds)
- Format: "📤 Sent N analytics events to PostHog (async, Xms)"
- Processing time should be <100ms

Status: ☐ Verified
```

**Check 2: Error Logs**
```
Search: "Failed to.*analytics" OR "analytics.*error"

Expected:
- No errors related to analytics
- Only expected logs like "⚠️ PostHog Key not found" in TEST_MODE

Status: ☐ Verified
```

**Check 3: Story Generation Time**
```
Method: Manual testing
Action: Generate 5 stories
Expected: Each completes in <2 seconds

Measurements:
1. Story 1: ______ seconds
2. Story 2: ______ seconds
3. Story 3: ______ seconds
4. Story 4: ______ seconds
5. Story 5: ______ seconds

Average: ______ seconds
Status: ☐ Verified (<2 seconds each)
```

### Day 1: Extended Monitoring (Hour 2-12)

**Check 4: PostHog Event Ingestion**
```
Location: PostHog Dashboard > Events
Look for: story_generated, audio_generated, voice_cloned, etc.

Expected:
- Events flowing in consistently
- Event rate matches user activity
- No gaps or drops

Status: ☐ Verified
```

**Check 5: Queue Stability**
```
Look in logs for: "queue size:" messages
Expected: Queue size stays <100 (background processing keeps up)

Typical pattern:
- 📝 [Analytics] Queued event (queue size: 1)
- 📝 [Analytics] Queued event (queue size: 2)
- ... grows to 10 ...
- 📤 Sent 10 analytics events (processed)
- Back to queue size: 1

Status: ☐ Verified
```

**Check 6: Error Rate Monitoring**
```
Expected: <0.1% error rate
No new error patterns introduced
Analytics failures are graceful (logged, not crashing)

Status: ☐ Verified
```

### Day 2-3: Performance Validation

**Check 7: Latency Comparison**
```
Method: PostHog Insights
Create query: Select story_generated events
Graph: Duration over time

Before deployment: 2.3-2.5s
After deployment: Should be <2.0s

Improvement: Target 15-23% reduction

Actual result: ______ seconds
Improvement: ______ %

Status: ☐ Verified
```

**Check 8: Event Delivery Rate**
```
Calculation: totalEventsProcessed / (totalEventsProcessed + totalEventsFailed)

Expected: >99%

Actual: ______ %
Status: ☐ Verified (>99%)
```

**Check 9: Memory Stability**
```
Monitor: Node process memory usage in Cloud Logging
Expected: No unbounded growth
Typical: Stable within 100-200 MB range

Pattern: Stable ☐ | Growing ☐ | Spike then stable ☐

Status: ☐ Verified
```

**Check 10: User Feedback**
```
Monitor: User reports, support tickets
Expected: No new issues reported related to:
- Analytics failures
- Slow story generation
- Missing analytics events

Status: ☐ No issues reported
```

---

## ✅ Verification Phase (Post-Monitoring)

### Success Metrics Verification

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Story generation latency | <2.0s | ____ s | ☐ Pass |
| Latency improvement | 15-23% | ____% | ☐ Pass |
| PostHog event delivery | >99% | ____% | ☐ Pass |
| Queue size (stable) | <100 | ____ | ☐ Pass |
| Error rate | <0.1% | ____% | ☐ Pass |
| Memory stability | Stable | ____ | ☐ Pass |
| User issues | None | ____ | ☐ Pass |
| Test pass rate | 100% | ____% | ☐ Pass |

### Documentation Verification
- [ ] All metrics documented in ASYNC_ANALYTICS_SUMMARY.md
- [ ] Performance improvement confirmed
- [ ] No regressions found
- [ ] Team notified of successful deployment

---

## 🔄 Rollback Procedure (If Needed)

### When to Rollback
- Story generation latency increases (>2.5s)
- Event delivery drops below 95%
- Critical errors in logs
- User reports of broken functionality
- Queue continuously grows (>1000)

### How to Rollback
```bash
# 1. Find the pre-deployment commit
git log --oneline | head -20

# 2. Revert to previous commit
git revert <commit-hash>

# 3. Push (Firebase auto-deploys)
git push origin main

# Expected: App returns to pre-M002 state (5-10 min)

# 4. Verify
# - Logs show old analytics pattern
# - Story generation time returns to baseline
# - No errors
```

### Post-Rollback Analysis
- [ ] Collect error logs from the deployment period
- [ ] Document what went wrong
- [ ] Schedule post-mortem meeting
- [ ] Plan fixes before re-deployment

---

## 📝 Sign-Off

### Deployment Team
- Name: _________________ 
- Date: _________________
- Status: ☐ Complete

### QA/Testing Team
- Name: _________________
- Date: _________________
- Status: ☐ All tests pass

### Product Team
- Name: _________________
- Date: _________________
- Status: ☐ Approved for release

### Monitoring Team
- Name: _________________
- Date: _________________
- Status: ☐ All metrics verified

---

## 📞 Escalation Contacts

**Deployment Issues:**
- Primary: [Engineering Lead]
- Backup: [DevOps Lead]

**Analytics Issues:**
- Primary: [Analytics Engineer]
- Backup: [Backend Lead]

**Performance Issues:**
- Primary: [Performance Engineer]
- Backup: [Platform Lead]

---

## 📚 Reference Documents

1. **ANALYTICS_MIGRATION.md** - Full migration guide
2. **TESTING_ASYNC_ANALYTICS.md** - Testing procedures
3. **docs/ANALYTICS_ASYNC_SYSTEM.md** - Technical details
4. **ASYNC_ANALYTICS_SUMMARY.md** - Implementation summary

---

## ✨ Notes

**What was deployed:**
- Async analytics wrapper (fire-and-forget)
- Event batching system
- Health monitoring
- 100+ lines of tests & documentation

**What changed:**
- Story generation no longer waits for PostHog
- All events still captured (async batched)
- Better scalability and throughput

**What stayed the same:**
- Event names and properties
- PostHog API integration
- Data retention policies
- User-visible functionality

---

**Deployment Date:** ____________  
**Deployed By:** ____________  
**Status:** ☐ IN PROGRESS ☐ COMPLETE ☐ ROLLED BACK
