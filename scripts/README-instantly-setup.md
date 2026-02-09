# Instantly.ai Campaign Auto-Setup

**API-first automation** voor V10.1 sequence configuratie

## 🚀 Quick Start

```bash
# 1. Install dependencies (if needed)
npm install axios

# 2. Set environment variables
export INSTANTLY_API_KEY="your_api_key_here"
export INSTANTLY_CAMPAIGN_KDV="campaign_id_kdv"
export INSTANTLY_CAMPAIGN_SCHOOL="campaign_id_school"
export INSTANTLY_CAMPAIGN_PRO="campaign_id_pro"

# 3. Run setup
node scripts/setup-instantly-campaigns.js
```

## 📋 What It Does

**Automatically configures** all 3 campaigns with:
- ✅ 5-email V10.1 sequence
- ✅ Correct intervals (3/3/3/5 days)
- ✅ Campaign settings (stop_on_reply, schedule, etc.)
- ✅ Email templates with variable placeholders
- ✅ Validation checks

**Time saved**: ~45 minutes of manual setup → **2 minutes automated**

## 🔑 Getting Your API Key

1. Log in to Instantly.ai
2. Go to **Settings** → **API & Webhooks**
3. Copy your API key
4. Set as environment variable

## 📧 Configured Emails

| Email | Delay | Type |
|-------|-------|------|
| #1 | 0 days | Dynamic (GPT) |
| #2 | 3 days | Social proof |
| #3 | 3 days | Use case |
| #4 | 3 days | Opt-out offer |
| #5 | 5 days | Breakup |

## ✅ Validation

Script includes automatic checks for:
- Sequence count (5 emails)
- Stop on reply enabled
- Email gap (120 min)
- Schedule (weekdays 08:00-18:00)

## 🐛 Troubleshooting

**API Key Invalid**:
```bash
❌ Error: INSTANTLY_API_KEY not set
```
→ Check API key is correct

**Missing Campaign IDs**:
```bash
❌ Missing campaign IDs: kdv, school
```
→ Set all 3 campaign environment variables

**API Error 404**:
→ Verify campaign IDs are correct

## 📚 Related

- [V10.1 Walkthrough](../brain/4f041715-1b0f-479e-ad57-d0114b8bf6ed/ai_prompt_v10_final.md)
- [Manual Setup Guide](../brain/4f041715-1b0f-479e-ad57-d0114b8bf6ed/instantly_campaign_setup_v10.md)
- [Follow-Up Sequence](../brain/4f041715-1b0f-479e-ad57-d0114b8bf6ed/follow_up_sequence_v10.md)
