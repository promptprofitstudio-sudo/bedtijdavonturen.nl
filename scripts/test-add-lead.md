# Add Test Lead via API

Quick script to test the Instantly API lead induction with custom variables.

## Usage

```bash
# From project root
npx tsx scripts/test-add-lead.ts
```

## What It Does

Replicates the exact behavior of `fase5_sequence()` in Partner Hunter V4:

1. Fetches `INSTANTLY_API_KEY` and `INSTANTLY_CAMPAIGN_KDV` from Google Secret Manager
2. Creates a test lead with all V10.1 custom variables:
   - subject_a, subject_b
   - greeting, body, cta
   - closing, optout, angle
3. POSTs to `https://api.instantly.ai/api/v2/leads`
4. Prints response

## Expected Result

```
✅ SUCCESS!
Response: { leads_created: 1, leads_skipped: 0 }
```

The test lead will appear in your KDV campaign with all custom variables populated.

## Verification

After running:
1. Go to Instantly → KDV Campaign → Leads
2. Find `test@bedtijdavonturen.nl`
3. Click on it → check custom variables sidebar
4. Go to Sequences → Email #1 → Preview with this lead

## Deduplication

Script uses `skip_if_in_workspace: true`, so:
- First run: Creates lead ✅
- Second run: Skips (already exists) ⏭️

To test again, delete the lead in Instantly UI first.
