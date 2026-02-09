#!/bin/bash
# Enable Warmup for Instantly.ai Account via API
# Uses POST /api/v2/accounts/warmup/enable endpoint

set -e

echo "🔥 Instantly.ai Warmup Enabler"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Configuration
EMAIL_ADDRESS="${1:-michel@bedtijdavonturen.nl}"
PROJECT="bedtijdavonturen-prod"

echo "📧 Email Account: $EMAIL_ADDRESS"
echo ""

# Get API key from Secret Manager
echo "🔐 Fetching API key from Secret Manager..."
INSTANTLY_API_KEY=$(gcloud secrets versions access latest --secret="INSTANTLY_API_KEY" --project="$PROJECT" 2>/dev/null)

if [ -z "$INSTANTLY_API_KEY" ]; then
  echo "❌ Failed to fetch INSTANTLY_API_KEY from Secret Manager"
  exit 1
fi

echo "  ✅ API key retrieved"
echo ""

# Step 1: Get list of accounts  
echo "🔍 Finding account ID for $EMAIL_ADDRESS..."
ACCOUNTS_RESPONSE=$(curl -s -X GET "https://api.instantly.ai/api/v2/accounts" \
  -H "Authorization: Bearer $INSTANTLY_API_KEY" \
  -H "Content-Type: application/json")

# The API response has structure: {"items": [...], "next_starting_after": "..."}
# We need to check warmup_status: 0 = disabled, 1 = enabled
WARMUP_STATUS=$(echo "$ACCOUNTS_RESPONSE" | jq -r ".items[] | select(.email == \"$EMAIL_ADDRESS\") | .warmup_status" 2>/dev/null || echo "")

if [ -z "$WARMUP_STATUS" ]; then
  echo "❌ Could not find account for $EMAIL_ADDRESS"
  echo ""
  echo "Available accounts:"
  echo "$ACCOUNTS_RESPONSE" | jq -r '.items[] | "  - \(.email) (warmup: \(if .warmup_status == 1 then "enabled" else "disabled" end))"' 2>/dev/null || echo "$ACCOUNTS_RESPONSE"
  echo ""
  echo "💡 Make sure the email account exists in Instantly.ai"
  exit 1
fi

# Check if warmup is already enabled
if [ "$WARMUP_STATUS" = "1" ]; then
  echo "  ℹ️  Warmup is ALREADY ENABLED for $EMAIL_ADDRESS"
  echo ""
  echo "📊 Current Status:"
  echo "$ACCOUNTS_RESPONSE" | jq -r ".items[] | select(.email == \"$EMAIL_ADDRESS\") | {
    email,
    warmup_status: (if .warmup_status == 1 then \"enabled\" else \"disabled\" end),
    warmup_score: .stat_warmup_score,
    status: (if .status == 1 then \"active\" else \"inactive\" end)
  }" 2>/dev/null
  echo ""
  echo "✅ No action needed - warmup is already running!"
  echo ""
  echo "🔍 Monitor progress at:"
  echo "  https://app.instantly.ai/settings/sending-accounts"
  exit 0
fi

echo "  ✅ Account found (warmup currently: disabled)"
echo ""

# Step 2: Enable warmup using API v2
echo "🚀 Enabling warmup via API v2..."

# API v2 uses 'emails' parameter, not 'account_ids'
WARMUP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "https://api.instantly.ai/api/v2/accounts/warmup/enable" \
  -H "Authorization: Bearer $INSTANTLY_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"emails\": [\"$EMAIL_ADDRESS\"]
  }")

HTTP_CODE=$(echo "$WARMUP_RESPONSE" | tail -1)
BODY=$(echo "$WARMUP_RESPONSE" | sed '$d')

echo ""
echo "📬 Response (HTTP $HTTP_CODE):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "202" ]; then
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  echo ""
  echo "✅ Warmup enabled successfully!"
  echo ""
  echo "📊 What happens now:"
  echo "  1. Instantly starts background warmup job"
  echo "  2. Sends 5 emails/day initially"
  echo "  3. Gradually increases to 50 emails/day"
  echo "  4. Duration: 21-28 days"
  echo ""
  echo "🔍 Monitor progress:"
  echo "  Dashboard: https://app.instantly.ai/settings/sending-accounts"
  echo "  Look for: Deliverability score, Inbox rate"
  echo ""
  echo "⏰ Timeline:"
  echo "  Today: Warmup starts (5 emails/day)"
  echo "  Day 7: ~20 emails/day"
  echo "  Day 14: ~35 emails/day"
  echo "  Day 21: ~50 emails/day (READY)"
  echo ""
  
  # Extract background job ID if present
  JOB_ID=$(echo "$BODY" | jq -r '.job_id // .id // empty' 2>/dev/null)
  
  if [ -n "$JOB_ID" ]; then
    echo "📋 Background Job ID: $JOB_ID"
    echo ""
    echo "Check job status:"
    echo "  curl -H \"Authorization: Bearer \$INSTANTLY_API_KEY\" \\"
    echo "    \"https://api.instantly.ai/api/v2/background-jobs/$JOB_ID\""
  fi
else
  echo "❌ Warmup enablement failed with HTTP $HTTP_CODE"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  echo ""
  echo "💡 Possible issues:"
  echo "  - Account already has warmup enabled"
  echo "  - Invalid account ID"
  echo "  - API key lacks permissions"
  echo "  - Instantly.ai API limitation"
  echo ""
  echo "Try manually in dashboard:"
  echo "  https://app.instantly.ai/settings/sending-accounts"
fi
