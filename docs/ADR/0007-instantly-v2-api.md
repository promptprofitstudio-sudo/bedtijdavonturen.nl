# ADR 0007: Instantly.ai V2 API Integration

**Status:** Accepted  
**Date:** 2026-02-02 (Updated: 2026-02-03)  
**Deciders:** Michel Korpershoek, Antigravity AI  
**Tags:** `instantly-api`, `cold-outreach`, `api-integration`, `lessons-learned`, `v10-1-compliance`

---

## Context

Partner Growth Engine v4.0 requires programmatic creation of email campaigns and automated lead sequencing via Instantly.ai's platform. The platform provides a V2 REST API, but documentation was incomplete and certain field requirements were undocumented.

This ADR documents the **hard-won learnings** from integrating with Instantly.ai's V2 API through trial-and-error discovery.

---

## Decision

We will use Instantly.ai V2 API for both **campaign provisioning** and **lead sequencing**, with specific adherence to discovered schema requirements.

---

## API Findings & Critical Discoveries

### 1. Campaign Creation (`POST /api/v2/campaigns`)

#### Authentication
```http
Authorization: Bearer {INSTANTLY_API_KEY}
Content-Type: application/json
```

**Discovery**: V2 uses Bearer token auth (not Basic auth like V1)

#### Required Payload Structure

Minimal working example:

```json
{
  "name": "Campaign Name",
  "campaign_schedule": {
    "schedules": [{
      "name": "Schedule Name",
      "timing": {
        "from": "09:00",
        "to": "17:00"
      },
      "days": {
        "0": false,
        "1": true,
        "2": true,
        "3": true,
        "4": true,
        "5": true,
        "6": false
      },
      "timezone": "Etc/GMT+12"
    }]
  }
}
```

#### Critical Schema Traps Discovered

**❌ Trap 1: `days` as Array**
```json
// FAILS with cryptic error
"days": [1, 2, 3, 4, 5]
```

**✅ Solution: `days` as Object**
```json
// Sunday = 0, Monday = 1, ... Saturday = 6
"days": {
  "0": false, // Sunday
  "1": true,  // Monday
  "2": true,  // Tuesday
  "3": true,  // Wednesday
  "4": true,  // Thursday
  "5": true,  // Friday
  "6": false  // Saturday
}
```

**Lesson**: Schema uses object with string keys "0"-"6", not array indices.

---

**❌ Trap 2: Missing `name` in Schedule**
```json
"schedules": [{
  "timing": {...},
  "days": {...}
}]
// ERROR: "must have required property 'name'"
```

**✅ Solution: Always include `name`**
```json
"schedules": [{
  "name": "Weekday Schedule", // Required!
  "timing": {...},
  "days": {...}
}]
```

**Lesson**: `name` field is mandatory but not mentioned in docs.

---

**❌ Trap 3: Invalid Timezone**
```json
"timezone": "Europe/Amsterdam"
// ERROR: "must be equal to one of the allowed values"
```

**✅ Solution: Use IANA Strict Format**
```json
"timezone": "Etc/GMT+12"
```

**Allowed Timezones** (discovered via existing campaign inspection):
- `Etc/GMT+12`, `Etc/GMT+11`, etc.
- NOT standard IANA like `Europe/Amsterdam`

**Lesson**: Instantly uses Etc/GMT format, not regional timezones.

---

### 2. Email Sequence Creation (`PATCH /api/v2/campaigns/{id}`)

#### Endpoint
```http
PATCH https://api.instantly.ai/api/v2/campaigns/{campaign_id}
Authorization: Bearer {INSTANTLY_API_KEY}
```

#### Payload
```json
{
  "sequences": [{
    "steps": [{
      "type": "email",
      "delay": 0,
      "variants": [{
        "subject": "{{subject_a}}",
        "body": "{{opening}}\n\n{{body}}\n\n{{cta_question}}\n\nMet vriendelijke groet,\nMichel Korpershoek"
      }]
    }]
  }]
}
```

**Discovery**: Use `PATCH` not `POST` to update existing campaign with sequences.

**Variable Interpolation**: Instantly supports `{{custom_var}}` syntax for lead-specific content.

---

### 3. Lead Sequencing (`POST /api/v2/leads`)

#### Critical Field Name Discovery

**❌ Fails:**
```json
{
  "campaign_id": "abc-123",  // V1 syntax
  "leads": [...]
}
// ERROR: unknown field
```

**✅ Works:**
```json
{
  "campaign": "abc-123",  // V2 uses 'campaign' not 'campaign_id'
  "skip_if_in_workspace": false,
  "leads": [...]
}
```

**Lesson**: V2 renamed `campaign_id` → `campaign`.

---

#### Lead Object Schema

```json
{
  "email": "contact@example.nl",
  "first_name": "John",
  "last_name": "Doe",
  "company_name": "Example BV",
  "website": "https://example.nl",
  "custom_variables": {
    "subject_a": "...",
    "opening": "...",
    "body": "...",
    "cta_question": "...",
    "fit_score": "85"
  }
}
```

**Field Naming**: snake_case (`first_name`, `company_name`, `custom_variables`)

**Custom Variables**:
- Flat object (no nesting)
- All values must be strings (convert numbers/booleans)
- Max ~50 custom variables per lead

---

## Implementation Pattern

### Campaign Creation Script

```bash
#!/bin/bash
INSTANTLY_KEY=$(gcloud secrets versions access latest --secret="INSTANTLY_API_KEY")

curl -X POST "https://api.instantly.ai/api/v2/campaigns" \
  -H "Authorization: Bearer $INSTANTLY_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "KDV_Outreach",
    "campaign_schedule": {
      "schedules": [{
        "name": "Weekday Schedule",
        "timing": {"from": "09:00", "to": "17:00"},
        "days": {"0": false, "1": true, "2": true, "3": true, "4": true, "5": true, "6": false},
        "timezone": "Etc/GMT+12"
      }]
    }
  }'
```

### Lead Push (TypeScript)

```typescript
const payload = {
  campaign: campaignId, // UUID from campaign creation
  skip_if_in_workspace: false,
  leads: [{
    email: lead.email,
    first_name: lead.firstName || 'Partner',
    last_name: lead.lastName || '',
    company_name: lead.businessName,
    website: lead.website,
    custom_variables: {
      subject_a: messageKit.subject_a,
      opening: messageKit.opening,
      body: messageKit.body,
      cta_question: messageKit.cta_question,
      fit_score: lead.fitScore.toString()
    }
  }]
};

await axios.post('https://api.instantly.ai/api/v2/leads', payload, {
  headers: {
    'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
    'Content-Type': 'application/json'
  }
});
```

---

## Consequences

### Positive

✅ **Programmatic Campaign Creation**: Zero manual setup required  
✅ **Automated Lead Sequencing**: Full pipeline automation  
✅ **Custom Variables**: True personalization at scale  
✅ **Segment-Based Routing**: Different campaigns per audience type  
✅ **Secret Manager Integration**: Campaign IDs stored securely  

### Negative

⚠️ **Undocumented Schema Requirements**: Trial-and-error discovery needed  
⚠️ **Strict Validation**: Cryptic error messages for schema violations  
⚠️ **Timezone Quirks**: Non-standard IANA format  
⚠️ **V1 vs V2 Confusion**: Parameter names changed between versions  

---

## Lessons Learned

### 1. **Inspect Existing Resources First**

Before creating resources, list existing ones to see actual schema:

```bash
curl -H "Authorization: Bearer $KEY" \
  "https://api.instantly.ai/api/v2/campaigns"
```

This revealed the `days` object structure and timezone format.

### 2. **Use Python for Complex Payloads**

Bash JSON escaping is error-prone with multiline content. Python's `requests` library handles it cleanly:

```python
import requests
payload = {
    "campaign": campaign_id,
    "leads": [{
        "email": "test@example.com",
        "custom_variables": {
            "body": """Line 1

Line 2

Line 3"""  # Multiline strings work perfectly
        }
    }]
}
requests.post(url, json=payload, headers=headers)
```

### 3. **Store Campaign IDs Immediately**

After creating campaigns, save IDs to Secret Manager before sequencing:

```bash
CAMPAIGN_ID=$(curl ... | jq -r '.id')
echo -n "$CAMPAIGN_ID" | gcloud secrets create INSTANTLY_CAMPAIGN_KDV --data-file=-
```

This prevents orphaned campaigns if script fails midway.

### 4. **Validate JSON Mode Responses**

When using GPT-4o for message generation:

```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-4o",
  response_format: { type: "json_object" },
  // ...
});

const messageKit = JSON.parse(completion.choices[0].message.content);
// Always validate structure before pushing to Instantly
```

---

## Alternatives Considered

### Alternative 1: Manual Campaign Setup
**Rejected**: Not scalable, error-prone for 3+ campaigns

### Alternative 2: Zapier/Make.com Integration
**Rejected**: Less control, higher cost, vendor lock-in

### Alternative 3: Instantly.ai V1 API
**Rejected**: Deprecated, lacks key features

### Alternative 4: Different Email Platform (Lemlist, Woodpecker)
**Rejected**: Instantly has best deliverability and pricing

---

## Testing & Validation

### Test Campaign Creation

```bash
./scripts/create-instantly-campaigns.sh
```

Expected:
- 3 campaigns created
- IDs saved to Secret Manager
- Email templates added via API

### Test Lead Push

```bash
curl "https://testpartnerflow-xxx.a.run.app?testEmail=your@email.com"
```

Expected:
- Lead appears in Instantly dashboard
- Custom variables populated
- Ready to send

---

## References

- [Instantly.ai V2 Documentation](https://developer.instantly.ai/) (incomplete)
- [Partner Engine V4 Implementation](../marketing/partner_engine_v4_implementation.md)
- [Campaign Creation Script](../../scripts/create-instantly-campaigns.sh)
- [Template Addition Script](../../scripts/add-instantly-templates.py)

---

## Related ADRs

- [ADR 0006: Partner Growth Engine v4.0](./0006-partner-growth-engine-v4.md)
- [ADR 0009: AI Message Kit Generation](./0009-ai-message-kit.md)

---

**Last Updated:** 2026-02-03  
**Breaking Changes:** None (V2 API stable)  
**Recent Updates:** V10.1 5-email sequence compliance (Feb 3, 2026)

