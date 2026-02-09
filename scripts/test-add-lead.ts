/**
 * Add Test Lead to Instantly via API
 * This script demonstrates the EXACT payload that Partner Hunter V4 uses
 */

import axios from 'axios';
import { execSync } from 'child_process';

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'bedtijdavonturen-prod';

// Fetch secret from Google Secret Manager
function getSecret(secretName: string): string {
    try {
        console.log(`Fetching: ${secretName}...`);
        const secret = execSync(
            `gcloud secrets versions access latest --secret=${secretName} --project=${PROJECT_ID}`,
            { encoding: 'utf-8' }
        ).trim();
        return secret;
    } catch (error: any) {
        console.error(`Failed to fetch ${secretName}:`, error.message);
        throw error;
    }
}

async function addTestLead() {
    console.log('🧪 Adding test lead to Instantly via API\n');

    // Fetch credentials
    const apiKey = getSecret('INSTANTLY_API_KEY');
    const campaignKdv = getSecret('INSTANTLY_CAMPAIGN_KDV');

    console.log('✅ Credentials fetched\n');

    // Test lead data (matches V10.1 format)
    const testLead = {
        campaign_id: campaignKdv,  // Bulk endpoint uses campaign_id
        skip_if_in_workspace: true,  // Prevents duplicates
        leads: [{
            email: 'michelkorpershoek@me.com',  // User's email for testing
            first_name: 'Test',
            last_name: 'Partner',
            company_name: 'Test KDV Amsterdam',
            website: 'test-kdv.nl',
            custom_variables: {
                // V10.1 messageKit variables
                subject_a: 'Korte vraag voor Test KDV',
                subject_b: 'Voor jullie ouders',
                greeting: 'Beste team van Test KDV,',
                body: `Ik kwam Test KDV in Amsterdam tegen en had een korte vraag over hoe jullie ouders ondersteunen.


Bedtijdavonturen.nl maakt gepersonaliseerde bedtijdverhalen die ouders kunnen voorlezen als vast avondritueel. Een rustige, leuke afsluiting van de dag.


Delen jullie weleens tips of materiaal met ouders voor het laatste stukje van de dag?`,
                cta: 'Zal ik 2 korte voorbeelden sturen? Met wie kan ik dit het beste afstemmen?',
                closing: `Met vriendelijke groet,
Michel Korpershoek
Bedtijdavonturen.nl`,
                optout: 'Geen interesse? Laat het weten, dan stop ik.',
                angle: 'avondritueel',
                city: 'Amsterdam',
                rating: '4.5'
            }
        }]
    };

    console.log('📤 Sending test lead to Instantly...\n');
    console.log('Campaign:', campaignKdv);
    console.log('Email:', testLead.leads[0].email);
    console.log('Custom Variables:', Object.keys(testLead.leads[0].custom_variables).length, 'variables\n');

    try {
        const response = await axios.post(
            'https://api.instantly.ai/api/v2/leads/add',  // Bulk endpoint
            testLead,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ SUCCESS!\n');
        console.log('Response:', response.data);
        console.log('\n📋 Next Steps:');
        console.log('1. Go to Instantly → KDV Campaign → Leads');
        console.log('2. Find test@bedtijdavonturen.nl');
        console.log('3. Check custom variables are populated');
        console.log('4. Preview Email #1 to verify template rendering');

    } catch (error: any) {
        console.error('❌ FAILED\n');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
        throw error;
    }
}

// Run
addTestLead().catch(err => {
    console.error('Script failed:', err.message);
    process.exit(1);
});
