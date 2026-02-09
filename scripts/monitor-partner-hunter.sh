#!/bin/bash
# Monitor Partner Hunter V4 status and leads

set -euo pipefail

PROJECT="bedtijdavonturen-prod"

echo "=== Partner Hunter V4 Status Monitor ==="
echo ""

# Check function logs (last run)
echo "📊 Last 10 Executions:"
gcloud functions logs read partnerHunterV4 \
  --project=$PROJECT \
  --region=us-central1 \
  --limit=50 2>/dev/null | \
  grep -E "(DRY-RUN|PRODUCTION|STARTING|COMPLETE)" | \
  head -10

echo ""
echo "📈 KDV Campaign Status:"
CAMPAIGN_ID=$(gcloud secrets versions access latest --secret=INSTANTLY_CAMPAIGN_KDV --project=$PROJECT)
INSTANTLY_KEY=$(gcloud secrets versions access latest --secret=INSTANTLY_API_KEY --project=$PROJECT)

curl -s "https://api.instantly.ai/api/v2/campaigns/$CAMPAIGN_ID" \
  -H "Authorization: Bearer $INSTANTLY_KEY" | \
  jq '{
    name: .name,
    status: (if .status == 1 then "Active" elif .status == 2 then "Paused" else "Unknown" end),
    leads_count: .leads_count,
    warmup_completed: .warmup_completed
  }'

echo ""
echo "💡 Tips:"
echo "  - DRY-RUN mode: Discovers leads, generates kits, NO sends"
echo "  - Production mode: Full pipeline including Instantly.ai sends"
echo "  - Check .env file: PARTNER_HUNTER_DRY_RUN=true (safe) / false (production)"
