# Backlog - Partner Hunter V4 & Instantly Campaigns

**Last Updated:** 2026-02-09  
**Project:** Bedtijdavonturen Partner Growth Engine

---

## High Priority (Before Feb 24 Production)

### Monitor DRY_RUN Executions
- [ ] **Feb 10, 09:00 CET** - First DRY_RUN execution
  - Check function logs for `🧪 DRY-RUN MODE - STARTING`
  - Verify no actual leads sent to Instantly
  - Confirm Firestore logs show `dryRun: true`
  - Validate timing aligns with corrected business hours (09:00-17:00 CET)
  - **Script:** `./scripts/monitor-partner-hunter.sh`

- [ ] **Feb 17** - Second DRY_RUN execution
  - Repeat verification steps from Feb 10
  - Confirm consistent behavior

### Timezone Resolution (Optional)
- [ ] Contact Instantly.ai support
  - Request Europe/Amsterdam timezone enablement
  - Explain business requirement for CET operations
  - Ask if this is account tier limitation
  - Document response

### Production Preparation
- [ ] **Feb 24** - Warmup completion verification
  - Check Instantly dashboard for warmup status
  - Verify sender reputation metrics
  - Confirm all campaigns show "warmup complete"

---

## Critical (Feb 24 Production Activation)

### Enable Production Mode
- [ ] Update deployment workflow
  - Edit `.github/workflows/deploy.yml` line 45
  - Change: `PARTNER_HUNTER_DRY_RUN=true` → `PARTNER_HUNTER_DRY_RUN=false`
  - Commit: `feat: enable production mode for partnerHunterV4`
  - Push to trigger deployment

### Campaign Activation
- [ ] Verify campaign statuses in Instantly dashboard
  - KDV_Outreach: Should auto-activate after warmup
  - Pro_Outreach: Verify active status
  - School_Outreach: Verify active status

### Documentation Updates
- [ ] Update AI-CONFIG with production status
- [ ] Mark warmup complete in production_mode_preparation.md
- [ ] Update timeline in relevant docs

---

## Post-Production (After Mar 3)

### First Production Run Monitoring
- [ ] **Mar 3, 09:00 CET** - Monitor first live execution
  - Check for `🚀 PRODUCTION MODE - STARTING` in logs
  - Verify `✅ Lead added to segment` messages
  - Confirm Firestore shows `dryRun: false`
  - Check Instantly dashboard for new leads

### Validation
- [ ] Verify leads added to correct campaigns
  - Check segment mapping (kdv_bso, pro, school)
  - Confirm custom variables populated correctly
  - Verify email scheduling (not sent prematurely)

### Performance Tracking
- [ ] Monitor first week metrics
  - Track open rates
  - Track reply rates
  - Monitor bounce/spam complaints
  - Compare to industry benchmarks

### Send Time Optimization
- [ ] Validate timezone workaround effectiveness
  - Confirm emails arrive during 09:00-17:00 CET
  - Track engagement by hour of receipt
  - Identify optimal send times within window

---

## Medium Priority (Q1 2026)

### Timezone Permanent Fix
- [ ] If Instantly enables Europe timezones:
  - Update all campaigns to `Europe/Amsterdam`
  - Revert business hours to standard 09:00-17:00
  - Remove workaround documentation
  - Update scripts

### Campaign Optimization
- [ ] A/B test subject line variations
  - Analyze which A/B variants perform better
  - Iterate on top performers
  
- [ ] Analyze follow-up effectiveness
  - Track which emails generate most replies
  - Optimize underperforming emails

### Automation Enhancements
- [ ] Reply tracking integration
  - Connect Instantly replies to CRM/notification system
  - Auto-flag hot leads for manual follow-up

- [ ] UTM tracking
  - Add UTM parameters to all links
  - Track click-through behavior

---

## Low Priority (Future)

### Advanced Features
- [ ] Dynamic interval adjustment
  - Adjust timing based on engagement patterns
  - Test shorter intervals for high-engagement leads

- [ ] Seasonal variations
  - Create holiday-specific subject variants
  - Adjust messaging for school calendar (summer break, etc.)

- [ ] Industry-specific customization
  - Tailor follow-up copy per segment
  - Create KDV vs School vs Pro specific sequences

### Infrastructure
- [ ] Campaign health monitoring dashboard
  - Automated alerting for anomalies
  - Daily digest of campaign performance

- [ ] Lead quality scoring
  - Track long-term conversion rates
  - Refine FitScore algorithm based on outcomes

---

## Completed Items (Archive)

### Feb 9, 2026
- [x] Audit all Instantly campaigns for V10.1 compliance
- [x] Delete legacy "Automated Outreach" campaign
- [x] Investigate School campaign configuration
- [x] Verify secret mappings for all campaigns
- [x] Discover and document timezone restriction
- [x] Implement timezone workaround (business hours adjustment)
- [x] Update all 3 campaigns with corrected send times
- [x] Create comprehensive audit documentation
- [x] Verify email intervals (0,3,6,9,14) across all campaigns

### Feb 3-9, 2026
- [x] Implement DRY_RUN safety controls in partnerHunterV4
- [x] Create monitoring scripts
- [x] Update deployment workflow with safety defaults
- [x] Document V10.1 compliance standards
- [x] Verify KDV_Outreach campaign compliance

---

## Notes

### Timezone Workaround Details
**Current Configuration (All Campaigns):**
- Timezone: `Etc/GMT+12` (API restriction - cannot change)
- Business Hours: 20:00-04:00 UTC-12
- **Effective NL Time: 09:00-17:00 CET** ✅

**Why This Works:**
```
09:00 CET = 20:00 previous day UTC-12
17:00 CET = 04:00 same day UTC-12
```

This workaround ensures emails send during optimal NL business hours despite timezone API limitation.

### Contact Information
- **Instantly.ai Support:** support@instantly.ai
- **Account Owner:** michel@bedtijdavonturen.nl
- **Technical Contact:** Michel Korpershoek

---

**Last Review:** 2026-02-09  
**Next Review:** 2026-02-10 (after first DRY_RUN)
