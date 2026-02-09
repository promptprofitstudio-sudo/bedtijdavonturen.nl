#!/bin/bash

echo "🔐 Validating Partner Growth API Keys"
echo "======================================"
echo ""

# 1. DataForSEO
echo "1️⃣  DataForSEO API"
DATAFORSEO_LOGIN=$(gcloud secrets versions access latest --secret="DATAFORSEO_LOGIN" --project=bedtijdavonturen-prod 2>&1)
DATAFORSEO_KEY=$(gcloud secrets versions access latest --secret="DATAFORSEO_API_KEY" --project=bedtijdavonturen-prod 2>&1)
echo "   Login: $DATAFORSEO_LOGIN"
echo "   Testing authentication..."
RESPONSE=$(curl -s -u "$DATAFORSEO_LOGIN:$DATAFORSEO_KEY" \
  https://api.dataforseo.com/v3/serp/google/maps/live/advanced \
  -H "Content-Type: application/json" \
  -d '[{"location_name":"Amsterdam,Netherlands","keyword":"test"}]')
if echo "$RESPONSE" | jq -e '.status_code == 20000' > /dev/null 2>&1; then
  echo "   ✅ DataForSEO: Authentication successful"
else
  echo "   ❌ DataForSEO: Failed"
  echo "   Response: $(echo $RESPONSE | jq -r '.status_message // .error // "Unknown error"')"
fi
echo ""

# 2. Hunter.io
echo "2️⃣  Hunter.io API"
HUNTER_KEY=$(gcloud secrets versions access latest --secret="HUNTER_API_KEY" --project=bedtijdavonturen-prod 2>&1)
echo "   Testing API key..."
RESPONSE=$(curl -s "https://api.hunter.io/v2/account?api_key=$HUNTER_KEY")
if echo "$RESPONSE" | jq -e '.data.email' > /dev/null 2>&1; then
  EMAIL=$(echo "$RESPONSE" | jq -r '.data.email')
  CALLS_LEFT=$(echo "$RESPONSE" | jq -r '.data.calls.left')
  echo "   ✅ Hunter.io: Authenticated as $EMAIL"
  echo "      API calls remaining: $CALLS_LEFT"
else
  echo "   ❌ Hunter.io: Failed"
  echo "   Response: $(echo $RESPONSE | jq -r '.errors[0].details // "Unknown error"')"
fi
echo ""

# 3. OpenAI
echo "3️⃣  OpenAI API"
OPENAI_KEY=$(gcloud secrets versions access latest --secret="OPENAI_API_KEY" --project=bedtijdavonturen-prod 2>&1)
echo "   Testing API key..."
RESPONSE=$(curl -s https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_KEY")
if echo "$RESPONSE" | jq -e '.data[0].id' > /dev/null 2>&1; then
  MODEL_COUNT=$(echo "$RESPONSE" | jq -r '.data | length')
  echo "   ✅ OpenAI: Authenticated ($MODEL_COUNT models accessible)"
else
  echo "   ❌ OpenAI: Failed"
  echo "   Response: $(echo $RESPONSE | jq -r '.error.message // "Unknown error"')"
fi
echo ""

# 4. Instantly.ai
echo "4️⃣  Instantly.ai API"
INSTANTLY_KEY=$(gcloud secrets versions access latest --secret="INSTANTLY_API_KEY" --project=bedtijdavonturen-prod 2>&1)
INSTANTLY_CAMPAIGN=$(gcloud secrets versions access latest --secret="INSTANTLY_CAMPAIGN_ID" --project=bedtijdavonturen-prod 2>&1)
echo "   API Key: ${INSTANTLY_KEY:0:20}..."
echo "   Campaign ID: $INSTANTLY_CAMPAIGN"
echo ""
echo "   Testing V2 API (recommended)..."
RESPONSE_V2=$(curl -s -X POST "https://api.instantly.ai/api/v2/leads" \
  -H "Content-Type: application/json" \
  -d "{\"api_key\": \"$INSTANTLY_KEY\", \"campaign_id\": \"$INSTANTLY_CAMPAIGN\", \"leads\": []}")
echo "   V2 Response: $(echo $RESPONSE_V2 | jq -r '.message // .error // .')"
echo ""
echo "   Testing V1 API (legacy)..."
RESPONSE_V1=$(curl -s -X POST "https://api.instantly.ai/api/v1/lead/add" \
  -H "Content-Type: application/json" \
  -d "{\"api_key\": \"$INSTANTLY_KEY\", \"campaign_id\": \"$INSTANTLY_CAMPAIGN\", \"leads\": []}")
echo "   V1 Response: $(echo $RESPONSE_V1 | jq -r '.message // .error // .')"
echo ""
echo "   Testing account endpoint..."
RESPONSE_ACCT=$(curl -s "https://api.instantly.ai/api/v1/account" \
  -H "Content-Type: application/json" \
  -d "{\"api_key\": \"$INSTANTLY_KEY\"}")
if echo "$RESPONSE_ACCT" | jq -e '.email' > /dev/null 2>&1; then
  ACCT_EMAIL=$(echo "$RESPONSE_ACCT" | jq -r '.email')
  echo "   ✅ Instantly.ai: Authenticated as $ACCT_EMAIL"
else
  echo "   ❌ Instantly.ai: Authentication failed"
  echo "   Response: $RESPONSE_ACCT"
fi

echo ""
echo "======================================"
echo "✅ API Validation Complete"
