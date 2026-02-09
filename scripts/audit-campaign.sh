#!/bin/bash
# Script to validate a specific Instantly campaign against V10.1 specs

set -euo pipefail

CAMPAIGN_ID=$1
CAMPAIGN_NAME=${2:-"Campaign"}

echo "🔍 Auditing: $CAMPAIGN_NAME"
echo "Campaign ID: $CAMPAIGN_ID"
echo ""

# Use TypeScript validation script with custom campaign ID
INSTANTLY_API_KEY=$(gcloud secrets versions access latest --secret=INSTANTLY_API_KEY --project=bedtijdavonturen-prod 2>/dev/null)

# Temporarily override the campaign ID in env
OLD_CAMPAIGN_ID=$(gcloud secrets versions access latest --secret=INSTANTLY_CAMPAIGN_KDV --project=bedtijdavonturen-prod 2>/dev/null)

# Set temp campaign ID
gcloud secrets versions access latest --secret=INSTANTLY_API_KEY --project=bedtijdavonturen-prod 2>/dev/null > /tmp/instantly_key.txt

# Fetch campaign details directly
curl -s "https://api.instantly.ai/api/v2/campaigns/$CAMPAIGN_ID" \
  -H "Authorization: Bearer $(cat /tmp/instantly_key.txt)" | \
  jq '{
    name,
    status: (if .status == 1 then "Active" elif .status == 2 then "Paused" else "Unknown" end),
    warmup_status,
    warmup_completed,
    leads_count,
    sequences: (.sequences | length),
    stop_on_reply: .stop_on_reply,
    daily_limit: .daily_limit
  }'

rm -f /tmp/instantly_key.txt
