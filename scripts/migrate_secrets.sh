#!/bin/bash

# Configuration
SOURCE_PROJECT="pps-core-441"
DEST_PROJECT="bedtijdavonturen-prod"

# List of secrets to migrate (from pps-core-441)
SECRETS=(
  "ANTHROPIC_API_KEY"
  "APIFY_TOKEN"
  "API_KEY"
  "DATAFORSEO_LOGIN"
  "DATAFORSEO_PASSWORD"
  "FELIX_GITHUB_TOKEN"
  "FIREBASE_APP_ID"
  "FIREBASE_AUTH_DOMAIN"
  "FIREBASE_MESSAGING_SENDER_ID"
  "FIREBASE_SERVICE_ACCOUNT_KEY"
  "FIREBASE_STORAGE_BUCKET"
  "GITHUB_PAT"
  "GOOGLE_AI_KEY"
  "HEYGEN_KEY_API"
  "HUNTER_KEY"
  "INSTANTLY_KEY"
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
  "OPENAI_API_KEY"
  "RESEND_KEY"
  "SERPAPI_KEY"
  "STOREFRONT_URL"
  "STRIPE_PUBLISHABLE_KEY"
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "TELEGRAM_TOKEN"
  "TWILIO_NUMBER"
  "TWILIO_SID"
  "TWILIO_TOKEN"
  "UNSPLASH_ACCESS_KEY"
  "UNSPLASH_SECRET_KEY"
  "UPTIMEROBOT_KEY"
  "VERTEX_GOOGLE_AI"
)

echo "🚀 Starting Secret Migration from $SOURCE_PROJECT to $DEST_PROJECT"

for SECRET in "${SECRETS[@]}"; do
  echo "Processing $SECRET..."
  
  # 1. Read Value
  VALUE=$(gcloud secrets versions access latest --secret="$SECRET" --project="$SOURCE_PROJECT" --quiet 2>/dev/null)
  
  if [ -z "$VALUE" ]; then
    echo "⚠️  Could not read $SECRET from source or it is empty. Skipping."
    continue
  fi

  # 2. Check/Create Secret in Dest
  EXISTS=$(gcloud secrets list --filter="name:$SECRET" --project="$DEST_PROJECT" --format="value(name)" --quiet)
  
  if [ -z "$EXISTS" ]; then
    echo "Creating secret $SECRET..."
    gcloud secrets create "$SECRET" --replication-policy="automatic" --project="$DEST_PROJECT" --quiet
  fi

  # 3. Add Version
  echo -n "$VALUE" | gcloud secrets versions add "$SECRET" --data-file=- --project="$DEST_PROJECT" --quiet
  echo "✅ Migrated $SECRET"
done

# --- Specific Aliases for Trojan Horse Function ---
echo "--- Configuring Aliases ---"

create_alias() {
    SRC=$1
    DEST=$2
    echo "Aliasing $SRC -> $DEST..."
    VAL=$(gcloud secrets versions access latest --secret="$SRC" --project="$SOURCE_PROJECT" --quiet 2>/dev/null)
    if [ -n "$VAL" ]; then
        gcloud secrets create "$DEST" --replication-policy="automatic" --project="$DEST_PROJECT" --quiet 2>/dev/null
        echo -n "$VAL" | gcloud secrets versions add "$DEST" --data-file=- --project="$DEST_PROJECT" --quiet
        echo "✅ Alias created: $DEST"
    else
        echo "❌ Source $SRC not found for alias."
    fi
}

create_alias "HUNTER_KEY" "HUNTER_API_KEY"
create_alias "INSTANTLY_KEY" "INSTANTLY_API_KEY"
create_alias "DATAFORSEO_PASSWORD" "DATAFORSEO_API_KEY"

echo "🎉 Migration Complete!"
