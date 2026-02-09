#!/bin/bash

echo "🔍 Testing GitHub Tokens for Workflow Scope"
echo "============================================"
echo ""

# Test GITHUB_PAT
echo "1️⃣  Testing GITHUB_PAT..."
GITHUB_PAT=$(gcloud secrets versions access latest --secret="GITHUB_PAT" --project=bedtijdavonturen-prod 2>&1)
if [[ "$GITHUB_PAT" == *"ERROR"* ]] || [[ -z "$GITHUB_PAT" ]]; then
    echo "   ❌ Failed to retrieve GITHUB_PAT"
else
    echo "   ✓ Retrieved token: ${GITHUB_PAT:0:15}..."
    SCOPES=$(curl -s -I -H "Authorization: token $GITHUB_PAT" https://api.github.com/user 2>&1 | grep -i "x-oauth-scopes:" | sed 's/x-oauth-scopes: //I')
    echo "   Scopes: $SCOPES"
    if echo "$SCOPES" | grep -qi "workflow"; then
        echo "   ✅ HAS WORKFLOW SCOPE!"
        WORKING_TOKEN="$GITHUB_PAT"
        WORKING_TOKEN_NAME="GITHUB_PAT"
    else
        echo "   ❌ Missing workflow scope"
    fi
fi

echo ""

# Test FELIX_GITHUB_TOKEN
echo "2️⃣  Testing FELIX_GITHUB_TOKEN..."
FELIX_TOKEN=$(gcloud secrets versions access latest --secret="FELIX_GITHUB_TOKEN" --project=bedtijdavonturen-prod 2>&1)
if [[ "$FELIX_TOKEN" == *"ERROR"* ]] || [[ -z "$FELIX_TOKEN" ]]; then
    echo "   ❌ Failed to retrieve FELIX_GITHUB_TOKEN"
else
    echo "   ✓ Retrieved token: ${FELIX_TOKEN:0:15}..."
    SCOPES=$(curl -s -I -H "Authorization: token $FELIX_TOKEN" https://api.github.com/user 2>&1 | grep -i "x-oauth-scopes:" | sed 's/x-oauth-scopes: //I')
    echo "   Scopes: $SCOPES"
    if echo "$SCOPES" | grep -qi "workflow"; then
        echo "   ✅ HAS WORKFLOW SCOPE!"
        WORKING_TOKEN="$FELIX_TOKEN"
        WORKING_TOKEN_NAME="FELIX_GITHUB_TOKEN"
    else
        echo "   ❌ Missing workflow scope"
    fi
fi

echo ""
echo "============================================"

if [[ -n "$WORKING_TOKEN" ]]; then
    echo "✅ Found working token: $WORKING_TOKEN_NAME"
    echo ""
    echo "Attempting git push with $WORKING_TOKEN_NAME..."
    cd /Users/michelkorpershoek/Downloads/bedtijdavonturen-next-tailwind-scaffold
    git push https://${WORKING_TOKEN}@github.com/promptprofitstudio-sudo/bedtijdavonturen.nl.git main
else
    echo "❌ No tokens with workflow scope found"
    echo "   You'll need to manually push or update a token with workflow scope"
fi
