#!/bin/bash

# Add Email Templates to Instantly Campaigns via API

set -e

echo "📧 Adding Email Templates to Instantly Campaigns..."
echo ""

# Get API key
INSTANTLY_KEY=$(gcloud secrets versions access latest --secret="INSTANTLY_API_KEY" --project=bedtijdavonturen-prod 2>&1)

# Get campaign IDs
KDV_CAMPAIGN=$(gcloud secrets versions access latest --secret="INSTANTLY_CAMPAIGN_KDV" --project=bedtijdavonturen-prod 2>&1)
SCHOOL_CAMPAIGN=$(gcloud secrets versions access latest --secret="INSTANTLY_CAMPAIGN_SCHOOL" --project=bedtijdavonturen-prod 2>&1)
PRO_CAMPAIGN=$(gcloud secrets versions access latest --secret="INSTANTLY_CAMPAIGN_PRO" --project=bedtijdavonturen-prod 2>&1)

echo "✅ Retrieved campaign IDs"
echo "   KDV: $KDV_CAMPAIGN"
echo "   School: $SCHOOL_CAMPAIGN"
echo "   Pro: $PRO_CAMPAIGN"
echo ""

# Email template (AI-generated content via variables)
EMAIL_SUBJECT='{{subject_a}}'
EMAIL_BODY='{{opening}}

{{body}}

{{cta_question}}

Met vriendelijke groet,
Michel Korpershoek
Bedtijdavonturen.nl'

add_email_sequence() {
    local CAMPAIGN_ID=$1
    local CAMPAIGN_NAME=$2
    
    echo "📝 Adding email sequence to: $CAMPAIGN_NAME"
    
    # Try to add a sequence step to the campaign
    RESPONSE=$(curl -s -X POST "https://api.instantly.ai/api/v2/campaigns/$CAMPAIGN_ID/sequences" \
        -H "Authorization: Bearer $INSTANTLY_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"steps\": [{
                \"type\": \"email\",
                \"delay\": 0,
                \"variants\": [{
                    \"subject\": \"$EMAIL_SUBJECT\",
                    \"body\": \"$EMAIL_BODY\"
                }]
            }]
        }")
    
    # Check response
    if echo "$RESPONSE" | grep -q '"error"'; then
        echo "   ⚠️  API returned error, trying alternative format..."
        echo "$RESPONSE" | jq .message 2>/dev/null || echo "$RESPONSE"
        
        # Try alternative endpoint/format
        RESPONSE2=$(curl -s -X POST "https://api.instantly.ai/api/v2/sequences" \
            -H "Authorization: Bearer $INSTANTLY_KEY" \
            -H "Content-Type: application/json" \
            -d "{
                \"campaign_id\": \"$CAMPAIGN_ID\",
                \"steps\": [{
                    \"type\": \"email\",
                    \"delay\": 0,
                    \"variants\": [{
                        \"subject\": \"$EMAIL_SUBJECT\",
                        \"body\": \"$EMAIL_BODY\"
                    }]
                }]
            }")
        
        if echo "$RESPONSE2" | grep -q '"error"'; then
            echo "   ❌ Failed to add sequence"
            echo "   Response: $(echo "$RESPONSE2" | jq .message 2>/dev/null || echo "$RESPONSE2")"
            echo ""
            echo "   💡 Manual setup required in dashboard"
            echo "   📋 Template to use:"
            echo "   Subject: $EMAIL_SUBJECT"
            echo "   Body: $EMAIL_BODY"
            echo ""
        else
            echo "   ✅ Sequence added successfully"
            echo ""
        fi
    else
        echo "   ✅ Sequence added successfully"
        echo ""
    fi
    
    sleep 2
}

# Add sequences to all campaigns
add_email_sequence "$KDV_CAMPAIGN" "KDV_Outreach"
add_email_sequence "$SCHOOL_CAMPAIGN" "School_Outreach"
add_email_sequence "$PRO_CAMPAIGN" "Pro_Outreach"

echo "✅ Email template setup complete!"
echo ""
echo "🔍 Verify in dashboard: https://app.instantly.ai/campaigns"
