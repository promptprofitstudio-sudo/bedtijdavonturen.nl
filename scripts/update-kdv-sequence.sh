#!/bin/bash
set -euo pipefail

# Update KDV_Outreach campaign to V10.1 compliance
# This script updates the existing campaign to preserve warmup progress

PROJECT="bedtijdavonturen-prod"

echo "🔄 Updating KDV Campaign to V10.1 Compliance"
echo ""

# Fetch secrets
echo "📡 Fetching credentials..."
CAMPAIGN_ID=$(gcloud secrets versions access latest --secret=INSTANTLY_CAMPAIGN_KDV --project=$PROJECT)
INSTANTLY_KEY=$(gcloud secrets versions access latest --secret=INSTANTLY_API_KEY --project=$PROJECT)

echo "Campaign ID: $CAMPAIGN_ID"
echo ""

# Load sequence payload
PAYLOAD_FILE="$(dirname "$0")/sequences/kdv_v10_1_sequence.json"

if [ ! -f "$PAYLOAD_FILE" ]; then
    echo "❌ Sequence payload not found: $PAYLOAD_FILE"
    exit 1
fi

echo "📝 Updating campaign sequence..."
RESPONSE=$(curl -s -X PATCH "https://api.instantly.ai/api/v2/campaigns/$CAMPAIGN_ID" \
  -H "Authorization: Bearer $INSTANTLY_KEY" \
  -H "Content-Type: application/json" \
  -d @"$PAYLOAD_FILE")

echo ""
echo "API Response:"
echo "$RESPONSE" | jq '.'
echo ""

# Check for errors
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo "❌ Update failed:"
    echo "$RESPONSE" | jq '.'
    exit 1
fi

if echo "$RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
    ERROR_MSG=$(echo "$RESPONSE" | jq -r '.message')
    if [ "$ERROR_MSG" != "null" ]; then
        echo "❌ Update failed: $ERROR_MSG"
        exit 1
    fi
fi

echo "✅ Campaign updated successfully!"
echo ""

# Validate the update
echo "🔍 Validating update..."
npx tsx "$(dirname "$0")/validate-instantly-sequence.ts"
