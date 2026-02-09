#!/bin/bash
# Add michel@bedtijdavonturen.nl as sender account via Instantly.ai API
# Reference: https://developer.instantly.ai/accounts/create-account

set -e

echo "🔐 Fetching INSTANTLY_API_KEY from Secret Manager..."
INSTANTLY_KEY=$(gcloud secrets versions access latest --secret="INSTANTLY_API_KEY" --project="bedtijdavonturen-prod")

echo ""
echo "📧 Adding michel@bedtijdavonturen.nl to Instantly.ai..."
echo ""

# For Google Workspace, we use provider_code=2 (Google)
# However, this requires SMTP/IMAP credentials or OAuth
# Since Google Workspace with OAuth is recommended, we'll use App Password method

# User needs to generate an App Password from:
# https://myaccount.google.com/apppasswords

echo "⚠️  REQUIRED: Generate App Password for michel@bedtijdavonturen.nl"
echo "   1. Go to: https://myaccount.google.com/apppasswords"
echo "   2. Sign in as michel@bedtijdavonturen.nl"
echo "   3. Create new App Password for 'Mail'"
echo "   4. Copy the 16-character password"
echo ""
read -p "Enter App Password (16 chars, no spaces): " APP_PASSWORD

if [ -z "$APP_PASSWORD" ]; then
  echo "❌ App Password required!"
  exit 1
fi

# Create account
RESPONSE=$(curl -s -X POST "https://api.instantly.ai/api/v2/accounts" \
  -H "Authorization: Bearer $INSTANTLY_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "michel@bedtijdavonturen.nl",
    "first_name": "Michel",
    "last_name": "Korpershoek",
    "provider_code": 2,
    "imap_username": "michel@bedtijdavonturen.nl",
    "imap_password": "'"$APP_PASSWORD"'",
    "imap_host": "imap.gmail.com",
    "imap_port": 993,
    "smtp_username": "michel@bedtijdavonturen.nl",
    "smtp_password": "'"$APP_PASSWORD"'",
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "daily_limit": 20,
    "sending_gap": 120
  }')

echo ""
echo "📬 Response:"
echo "$RESPONSE" | jq .

# Check if successful
if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
  ACCOUNT_ID=$(echo "$RESPONSE" | jq -r '.id')
  echo ""
  echo "✅ Success! Account ID: $ACCOUNT_ID"
  echo ""
  echo "📝 Next steps:"
  echo "   1. Enable warmup in Instantly.ai dashboard"
  echo "   2. Wait 21 days for warmup to complete"
  echo "   3. Assign to campaigns (KDV, School, Pro)"
  echo "   4. Deploy partnerHunterV4 Cloud Function"
else
  echo ""
  echo "❌ Failed to add account. Check error above."
  exit 1
fi
