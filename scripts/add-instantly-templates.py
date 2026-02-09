#!/usr/bin/env python3
"""
Add email templates to Instantly campaigns via API (Python approach for proper JSON handling)
"""

import json
import subprocess
import requests

def get_secret(secret_name):
    """Retrieve secret from Google Secret Manager"""
    result = subprocess.run(
        ['gcloud', 'secrets', 'versions', 'access', 'latest', 
         '--secret', secret_name, '--project', 'bedtijdavonturen-prod'],
        capture_output=True,
        text=True
    )
    return result.stdout.strip()

def main():
    print("📧 Adding Email Templates to Instantly Campaigns (Python API)...")
    print()
    
    # Get credentials
    api_key = get_secret('INSTANTLY_API_KEY')
    campaigns = {
        'KDV_Outreach': get_secret('INSTANTLY_CAMPAIGN_KDV'),
        'School_Outreach': get_secret('INSTANTLY_CAMPAIGN_SCHOOL'),
        'Pro_Outreach': get_secret('INSTANTLY_CAMPAIGN_PRO')
    }
    
    print(f"✅ Retrieved API key and {len(campaigns)} campaign IDs")
    print()
    
    # Email template content
    email_template = {
        "subject": "{{subject_a}}",
        "body": """{{opening}}

{{body}}

{{cta_question}}

Met vriendelijke groet,
Michel Korpershoek
Bedtijdavonturen.nl"""
    }
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    for campaign_name, campaign_id in campaigns.items():
        print(f"📝 Adding sequence to: {campaign_name}")
        print(f"   Campaign ID: {campaign_id}")
        
        # Try PATCH to update campaign with sequences
        payload = {
            "sequences": [{
                "steps": [{
                    "type": "email",
                    "delay": 0,
                    "variants": [{
                        "subject": email_template["subject"],
                        "body": email_template["body"]
                    }]
                }]
            }]
        }
        
        # Try updating campaign
        url = f"https://api.instantly.ai/api/v2/campaigns/{campaign_id}"
        response = requests.patch(url, headers=headers, json=payload)
        
        if response.status_code in [200, 201]:
            print(f"   ✅ Sequence added successfully")
        else:
            print(f"   ⚠️  PATCH failed (status {response.status_code})")
            print(f"   Response: {response.text[:200]}")
            
            # Try alternative: POST to sequences endpoint
            url2 = f"https://api.instantly.ai/api/v2/campaigns/{campaign_id}/sequences"
            response2 = requests.post(url2, headers=headers, json=payload)
            
            if response2.status_code in [200, 201]:
                print(f"   ✅ Sequence added via POST")
            else:
                print(f"   ❌ POST also failed (status {response2.status_code})")
                print(f"   Response: {response2.text[:200]}")
                print()
                print(f"   💡 Manual setup required:")
                print(f"   Subject: {email_template['subject']}")
                print(f"   Body: {email_template['body']}")
        
        print()
    
    print("✅ Template setup complete!")
    print()
    print("🔍 Verify: https://app.instantly.ai/campaigns")

if __name__ == '__main__':
    main()
