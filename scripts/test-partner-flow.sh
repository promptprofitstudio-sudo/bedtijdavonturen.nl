#!/bin/bash
# Test Partner Growth Engine v4.0
# Sends test email to michel@bedtijdavonturen.nl instead of real prospects

set -e

echo "🧪 Partner Growth Engine v4.0 - Test Run"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Configuration
TEST_EMAIL="michel@bedtijdavonturen.nl"
CITY="${1:-Amsterdam}"
SEARCH_TERM="${2:-kinderdagverblijf}"
PROJECT="bedtijdavonturen-prod"
REGION="europe-west1"

echo "📋 Configuration:"
echo "  Test Email: $TEST_EMAIL"
echo "  City: $CITY"
echo "  Search Term: $SEARCH_TERM"
echo ""

# Check if function is deployed
echo "🔍 Checking if testPartnerFlow is deployed..."
FUNCTION_EXISTS=$(gcloud functions list --project=$PROJECT --region=$REGION --filter="name:testPartnerFlow" --format="value(name)" 2>/dev/null || echo "")

if [ -z "$FUNCTION_EXISTS" ]; then
  echo ""
  echo "⚠️  testPartnerFlow function not deployed!"
  echo ""
  echo "Deploy it first with:"
  echo "  cd functions"
  echo "  npm run deploy -- --only functions:testPartnerFlow"
  echo ""
  exit 1
fi

echo "  ✅ Function deployed"
echo ""

# Get function URL
FUNCTION_URL="https://$REGION-$PROJECT.cloudfunctions.net/testPartnerFlow"

echo "🚀 Triggering test flow..."
echo "  URL: $FUNCTION_URL"
echo ""

# Call the function
RESPONSE=$(curl -s -w "\n%{http_code}" \
  "$FUNCTION_URL?testEmail=$TEST_EMAIL&city=$CITY&term=$SEARCH_TERM")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo ""
echo "📬 Response (HTTP $HTTP_CODE):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$HTTP_CODE" = "200" ]; then
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  echo ""
  echo "✅ Test completed successfully!"
  echo ""
  echo "📧 Check your inbox at: $TEST_EMAIL"
  echo ""
  echo "What to expect:"
  echo "  1. Personalized email from michel@bedtijdavonturen.nl"
  echo "  2. Subject uses AI-generated content"
  echo "  3. Body is tailored to the discovered business"
  echo "  4. Email appears in Instantly.ai campaign"
  echo ""
  echo "🔍 To view logs:"
  echo "  gcloud functions logs read testPartnerFlow \\"
  echo "    --project=$PROJECT \\"
  echo "    --region=$REGION \\"
  echo "    --limit=50"
else
  echo "❌ Test failed with HTTP $HTTP_CODE"
  echo "$BODY"
  echo ""
  echo "💡 Debugging tips:"
  echo "  1. Check function logs (see command above)"
  echo "  2. Verify all secrets are set in Secret Manager"
  echo "  3. Ensure warmup is complete (if testing email delivery)"
fi
