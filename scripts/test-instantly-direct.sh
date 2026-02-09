#!/bin/bash

INSTANTLY_KEY=$(gcloud secrets versions access latest --secret="INSTANTLY_API_KEY" --project=bedtijdavonturen-prod 2>&1)
CAMPAIGN_ID=$(gcloud secrets versions access latest --secret="INSTANTLY_CAMPAIGN_ID" --project=bedtijdavonturen-prod 2>&1)

echo "Testing Instantly.ai V2 API with exact payload from code..."
echo ""
echo "Campaign ID: $CAMPAIGN_ID"
echo ""

# Test with exact payload structure
curl -v -X POST "https://api.instantly.ai/api/v2/leads" \
  -H "Authorization: Bearer $INSTANTLY_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"campaign\": \"$CAMPAIGN_ID\",
    \"skip_if_in_workspace\": false,
    \"leads\": [{
      \"email\": \"test@example.com\",
      \"first_name\": \"Test\",
      \"last_name\": \"User\",
      \"company_name\": \"Test Company\",
      \"website\": \"https://test.com\",
      \"custom_variables\": {
        \"icebreaker\": \"Test message\",
        \"original_email\": \"original@test.com\"
      }
    }]
  }" 2>&1 | grep -E "< HTTP|{|}"
