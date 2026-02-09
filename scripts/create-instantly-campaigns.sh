#!/bin/bash

# Instantly.ai Campaign Creator v4.0
# Based on actual API structure from existing campaigns

set -e

echo "🚀 Creating 3 Instantly.ai Campaigns..."
echo ""

INSTANTLY_KEY=$(gcloud secrets versions access latest --secret="INSTANTLY_API_KEY" --project=bedtijdavonturen-prod 2>&1)
echo "✅ API Key retrieved"
echo ""

create_campaign() {
    local NAME=$1
    local SECRET_NAME=$2
    
    echo "📧 Creating: $NAME"
    
    # Correct payload structure based on existing campaign
    RESPONSE=$(curl -s -X POST "https://api.instantly.ai/api/v2/campaigns" \
        -H "Authorization: Bearer $INSTANTLY_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$NAME\",
            \"campaign_schedule\": {
                \"schedules\": [{
                    \"name\": \"Business Hours (NL)\",
                    \"timing\": {
                        \"from\": \"09:00\",
                        \"to\": \"17:00\"
                    },
                    \"days\": {
                        \"0\": false,
                        \"1\": true,
                        \"2\": true,
                        \"3\": true,
                        \"4\": true,
                        \"5\": true,
                        \"6\": false
                    },
                    \"timezone\": \"Etc/GMT+12\"
                }]
            }
        }")
    
    # Check for errors
    if echo "$RESPONSE" | grep -q '"error"'; then
        echo "   ❌ Failed:"
        echo "$RESPONSE" | jq .message
        return 1
    fi
    
    # Extract ID
    CAMPAIGN_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
    
    if [[ -n "$CAMPAIGN_ID" && "$CAMPAIGN_ID" != "null" ]]; then
        echo "   ✅ ID: $CAMPAIGN_ID"
        
        # Save to Secret Manager
        echo -n "$CAMPAIGN_ID" | gcloud secrets create "$SECRET_NAME" \
            --project=bedtijdavonturen-prod --data-file=- 2>&1 || \
        echo -n "$CAMPAIGN_ID" | gcloud secrets versions add "$SECRET_NAME" \
            --project=bedtijdavonturen-prod --data-file=- 2>&1
        
        echo "   💾 Saved to Secret Manager: $SECRET_NAME"
        echo ""
        return 0
    else
        echo "   ⚠️  Could not extract campaign ID"
        echo "$RESPONSE" | jq .
        return 1
    fi
}

# Create the 3 campaigns
create_campaign "KDV_Outreach" "INSTANTLY_CAMPAIGN_KDV"
create_campaign "School_Outreach" "INSTANTLY_CAMPAIGN_SCHOOL"  
create_campaign "Pro_Outreach" "INSTANTLY_CAMPAIGN_PRO"

echo "✅ All campaigns created!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to https://app.instantly.ai/campaigns"
echo "2. For each campaign, add email sequence:"
echo "   - Subject: {{subject_a}}"
echo "   - Body:"
echo "     {{opening}}"
echo "     "
echo "     {{body}}"
echo "     "
echo "     {{cta_question}}"
echo "     "
echo "     Met vriendelijke groet,"
echo "     Michel Korpershoek"
echo "     Bedtijdavonturen.nl"
echo ""
echo "3. Deploy: firebase deploy --only functions:partnerHunterV4"
