# API Integration Findings: PostHog & Instantly.ai

**Date**: 2026-02-02  
**Author**: Antigravity AI  
**Project**: Bedtijdavonturen.nl

---

## PostHog Analytics API

### Context
PostHog is used for product analytics and feature flags in Bedtijdavonturen.nl. Integration via Next.js SDK.

### Key Findings

#### 1. EU Cloud Migration (ADR-0004)
**Issue**: Initial setup used US cloud (posthog.com)  
**Solution**: Migrated to EU cloud (eu.posthog.com) for GDPR compliance

**Configuration**:
```typescript
// next.config.js
env: {
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: 'https://eu.posthog.com'
}
```

#### 2. Client-Side Initialization
**Pattern**: Lazy initialization to avoid blocking SSR

```typescript
// src/lib/posthog.ts
import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    }
  });
}
```

#### 3. Event Tracking Best Practices

**Structured Events**:
```typescript
posthog.capture('story_generated', {
  story_id: storyId,
  character: characterName,
  duration_seconds: duration,
  user_tier: userTier
});
```

**User Properties**:
```typescript
posthog.identify(userId, {
  email: userEmail,
  plan: 'premium',
  signup_date: signupDate
});
```

#### 4. Feature Flags

**Server-Side Evaluation** (not yet implemented):
```typescript
// Future enhancement for A/B testing
const showNewUI = await posthog.isFeatureEnabled('new-ui-redesign', userId);
```

### Lessons Learned

✅ **Always use EU cloud for European users** (GDPR)  
✅ **Never block SSR** with analytics initialization  
✅ **Structure events consistently** (noun_verb pattern)  
⚠️ **Public API key is safe** (designed for client-side use)  
⚠️ **Debug mode leaks PII** (disable in production via env check)

### References
- [ADR 0004: PostHog EU Migration](../docs/ADR/0004-posthog-eu-migration.md)
- [PostHog Documentation](https://posthog.com/docs)

---

## Instantly.ai V2 API

### Context
Instantly.ai is a cold email outreach platform used for Partner Growth Engine v4.0. Integrates via REST API V2.

### Critical Discoveries

#### 1. Campaign Creation Schema Traps

**Discovery Process**: Multiple failed iterations due to undocumented requirements.

##### Trap 1: `campaign_schedule.schedules` Array Structure

**❌ Initial Attempt (Failed)**:
```json
{
  "name": "Test Campaign",
  "campaign_schedule": {
    "schedules": [{
      "timing": {"from": "09:00", "to": "17:00"},
      "days": [1, 2, 3, 4, 5]
    }]
  }
}
```

**Error**: `"must have required property 'name'"`

**✅ Solution**: Each schedule requires `name` field
```json
{
  "name": "Test Campaign",
  "campaign_schedule": {
    "schedules": [{
      "name": "Weekday Schedule",  // Required!
      "timing": {"from": "09:00", "to": "17:00"},
      "days": {/* ... */}
    }]
  }
}
```

##### Trap 2: Days Object vs Array

**❌ Attempted (Failed)**:
```json
"days": [1, 2, 3, 4, 5]
```

**Error**: Validation failure (cryptic message)

**✅ Solution**: Object with string keys "0"-"6"
```json
"days": {
  "0": false,  // Sunday
  "1": true,   // Monday
  "2": true,   // Tuesday
  "3": true,   // Wednesday
  "4": true,   // Thursday
  "5": true,   // Friday
  "6": false   // Saturday
}
```

**How We Discovered**: Inspected existing campaign via `GET /api/v2/campaigns`

##### Trap 3: Timezone Validation

**❌ Attempted**:
```json
"timezone": "Europe/Amsterdam"
```

**Error**: `"must be equal to one of the allowed values"`

**✅ Solution**: Use `Etc/GMT` format
```json
"timezone": "Etc/GMT+12"
```

**Allowed Values**: `Etc/GMT+12`, `Etc/GMT+11`, ..., `Etc/GMT-12`

**Rationale**: Instantly uses IANA Etc/GMT format, not regional timezones.

---

#### 2. Authentication Evolution (V1 → V2)

**V1 (Deprecated)**:
```bash
curl -u username:password https://api.instantly.ai/v1/...
```

**V2 (Current)**:
```bash
curl -H "Authorization: Bearer {API_KEY}" https://api.instantly.ai/api/v2/...
```

**Migration Note**: Parameter names also changed (e.g., `campaign_id` → `campaign`)

---

#### 3. Lead Sequencing Field Naming

**❌ V1 Syntax (Fails in V2)**:
```json
{
  "campaign_id": "abc-123",
  "leads": [...]
}
```

**✅ V2 Syntax**:
```json
{
  "campaign": "abc-123",  // Note: 'campaign' not 'campaign_id'
  "skip_if_in_workspace": false,
  "leads": [...]
}
```

**Lead Object Schema** (snake_case):
```json
{
  "email": "contact@example.nl",
  "first_name": "John",
  "last_name": "Doe",
  "company_name": "Example BV",
  "website": "https://example.nl",
  "custom_variables": {
    "subject_a": "Custom subject line",
    "opening": "Beste John,",
    "body": "Full email body...",
    "cta_question": "Interested?",
    "fit_score": "85"  // All values must be strings!
  }
}
```

**Critical**: Custom variable values must be strings (convert numbers/booleans).

---

#### 4. Email Sequence Creation

**Method Discovery**: Initially tried `POST /api/v2/campaigns/{id}/sequences` (404 error).

**✅ Actual Method**: `PATCH /api/v2/campaigns/{id}`

```http
PATCH https://api.instantly.ai/api/v2/campaigns/abc-123
Authorization: Bearer {API_KEY}
Content-Type: application/json

{
  "sequences": [{
    "steps": [{
      "type": "email",
      "delay": 0,
      "variants": [{
        "subject": "{{subject_a}}",
        "body": "{{opening}}\n\n{{body}}\n\n{{cta_question}}\n\nBest regards"
      }]
    }]
  }]
}
```

**Variable Interpolation**: Use `{{variable_name}}` syntax (Mustache-style).

---

#### 5. JSON Escaping in Bash vs Python

**Problem**: Multiline email bodies in Bash JSON are error-prone.

**❌ Bash Approach (Fragile)**:
```bash
BODY="Line 1\n\nLine 2\n\nLine 3"
curl -d "{\"body\": \"$BODY\"}" ...
# Escaping nightmare!
```

**✅ Python Approach (Robust)**:
```python
import requests

payload = {
    "campaign": campaign_id,
    "leads": [{
        "custom_variables": {
            "body": """Line 1

Line 2

Line 3"""  # Python handles multiline strings perfectly
        }
    }]
}

requests.post(url, json=payload, headers=headers)
```

**Lesson**: Use Python for complex JSON payloads with multiline content.

---

### Implementation Patterns

#### Pattern 1: Campaign Provisioning Script

```bash
#!/bin/bash
# scripts/create-instantly-campaigns.sh

INSTANTLY_KEY=$(gcloud secrets versions access latest --secret="INSTANTLY_API_KEY")

CAMPAIGNS=("KDV_Outreach" "School_Outreach" "Pro_Outreach")
SECRETS=("INSTANTLY_CAMPAIGN_KDV" "INSTANTLY_CAMPAIGN_SCHOOL" "INSTANTLY_CAMPAIGN_PRO")

for i in "${!CAMPAIGNS[@]}"; do
  CAMPAIGN_ID=$(curl -s -X POST "https://api.instantly.ai/api/v2/campaigns" \
    -H "Authorization: Bearer $INSTANTLY_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "'"${CAMPAIGNS[$i]}"'",
      "campaign_schedule": {
        "schedules": [{
          "name": "Weekday Schedule",
          "timing": {"from": "09:00", "to": "17:00"},
          "days": {"0": false, "1": true, "2": true, "3": true, "4": true, "5": true, "6": false},
          "timezone": "Etc/GMT+12"
        }]
      }
    }' | jq -r '.id')
  
  echo -n "$CAMPAIGN_ID" | gcloud secrets create "${SECRETS[$i]}" --data-file=-
  echo "✅ ${CAMPAIGNS[$i]}: $CAMPAIGN_ID → ${SECRETS[$i]}"
done
```

#### Pattern 2: Template Addition (Python)

```python
# scripts/add-instantly-templates.py
import subprocess
import requests

def get_secret(name):
    result = subprocess.run(
        ['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret', name],
        capture_output=True, text=True
    )
    return result.stdout.strip()

api_key = get_secret('INSTANTLY_API_KEY')
campaigns = {
    'KDV': get_secret('INSTANTLY_CAMPAIGN_KDV'),
    'School': get_secret('INSTANTLY_CAMPAIGN_SCHOOL'),
    'Pro': get_secret('INSTANTLY_CAMPAIGN_PRO')
}

template = {
    "subject": "{{subject_a}}",
    "body": """{{opening}}

{{body}}

{{cta_question}}

Met vriendelijke groet,
Michel Korpershoek
Bedtijdavonturen.nl"""
}

for name, campaign_id in campaigns.items():
    response = requests.patch(
        f"https://api.instantly.ai/api/v2/campaigns/{campaign_id}",
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        json={
            "sequences": [{
                "steps": [{
                    "type": "email",
                    "delay": 0,
                    "variants": [template]
                }]
            }]
        }
    )
    print(f"{'✅' if response.ok else '❌'} {name}: {response.status_code}")
```

#### Pattern 3: Lead Push (TypeScript)

```typescript
// functions/src/marketing/partnerHunterV4.ts
async function pushToInstantly(
  lead: EnrichedLead,
  messageKit: MessageKit,
  campaignId: string,
  instantlyKey: string
): Promise<void> {
  const payload = {
    campaign: campaignId,
    skip_if_in_workspace: false,
    leads: [{
      email: lead.email,
      first_name: lead.firstName || 'Partner',
      last_name: lead.lastName || '',
      company_name: lead.businessName,
      website: lead.website,
      custom_variables: {
        subject_a: messageKit.subject_a,
        subject_b: messageKit.subject_b,
        opening: messageKit.opening,
        body: messageKit.body,
        ps: messageKit.ps,
        cta_question: messageKit.cta_question,
        angle: messageKit.angle,
        fit_score: lead.fitScore.toString(),
        city: lead.city,
        rating: lead.rating.toString()
      }
    }]
  };

  const response = await axios.post(
    'https://api.instantly.ai/api/v2/leads',
    payload,
    {
      headers: {
        'Authorization': `Bearer ${instantlyKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.status !== 200) {
    throw new Error(`Instantly API error: ${response.status}`);
  }
}
```

---

### Lessons Learned

#### 1. **Always Inspect Existing Resources First**
Before creating new campaigns, GET existing ones to see actual schema:
```bash
curl -H "Authorization: Bearer $KEY" \
  "https://api.instantly.ai/api/v2/campaigns" | jq '.'
```

This revealed the `days` object structure and timezone requirements.

#### 2. **Documentation is Incomplete**
Instantly's official docs don't mention:
- `name` requirement in schedules
- `days` object vs array
- Timezone format restrictions
- V2 parameter renames

**Solution**: Trial-and-error + inspect existing data.

#### 3. **Store IDs Immediately After Creation**
Don't wait until all campaigns are created. Save each ID to Secret Manager immediately:
```bash
CAMPAIGN_ID=$(curl ... | jq -r '.id')
echo -n "$CAMPAIGN_ID" | gcloud secrets create INSTANTLY_CAMPAIGN_KDV --data-file=-
```

Prevents orphaned campaigns if script fails midway.

#### 4. **Use Python for Complex Payloads**
JSON escaping in Bash is error-prone, especially with multiline strings. Python's `requests` library handles it cleanly.

#### 5. **Custom Variables Must Be Strings**
Even numbers and booleans:
```typescript
custom_variables: {
  fit_score: lead.fitScore.toString(),  // Not: lead.fitScore (number)
  test_run: 'true'                      // Not: true (boolean)
}
```

---

### API Comparison

| Feature | PostHog | Instantly.ai |
|---------|---------|--------------|
| **Auth** | Public API key (client-side) | Bearer token (server-side) |
| **Docs Quality** | Excellent | Incomplete (V2) |
| **Schema Strictness** | Lenient | Very strict, cryptic errors |
| **JSON Complexity** | Simple objects | Nested, specific types |
| **Error Messages** | Clear | Cryptic (`"must have required property 'name'"`) |
| **Trial & Error** | Minimal | Extensive (esp. campaign creation) |

---

### References

**Instantly.ai**:
- [ADR 0007: Instantly.ai V2 API](../docs/ADR/0007-instantly-v2-api.md)
- [Official Docs](https://developer.instantly.ai/) (incomplete for V2)
- [Campaign Creation Script](../scripts/create-instantly-campaigns.sh)
- [Template Addition Script](../scripts/add-instantly-templates.py)

**PostHog**:
- [ADR 0004: PostHog EU Migration](../docs/ADR/0004-posthog-eu-migration.md)
- [Official Docs](https://posthog.com/docs)

---

**Last Updated**: 2026-02-02  
**Next Review**: After 100 production leads (Q1 2026)
