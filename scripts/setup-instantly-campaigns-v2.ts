/**
 * Instantly.ai Campaign Auto-Setup Script (V10.1)
 * 
 * Uses Google Secret Manager for credentials
 * Updates existing campaigns with V10.1 sequence
 * 
 * Usage:
 * npx tsx scripts/setup-instantly-campaigns-v2.ts
 */

import axios from 'axios';
import { execSync } from 'child_process';

// Secret names in Google Secret Manager
const SECRET_NAMES = {
    apiKey: 'INSTANTLY_API_KEY',
    campaignKdv: 'INSTANTLY_CAMPAIGN_KDV',
    campaignSchool: 'INSTANTLY_CAMPAIGN_SCHOOL',
    campaignPro: 'INSTANTLY_CAMPAIGN_PRO'
};

const INSTANTLY_BASE_URL = 'https://api.instantly.ai/api/v2';
const PROJECT_ID = process.env.GCLOUD_PROJECT || 'bedtijdavonturen-prod';

// Email Templates (V10.1)
const EMAIL_TEMPLATES = {
    email1: {
        subject: '{{subject_a}}',
        subject_alt: '{{subject_b}}',
        body: `{{greeting}}

{{body}}

{{cta}}

{{closing}}

{{optout}}`,
        delay: 0,
        delay_unit: 'days'
    },

    email2: {
        subject: 'Re: {{subject_a}}',
        body: `Hoi,

Stuurde vorige week een korte vraag over oudercommunicatie.

Ik werk o.a. met KDV De Kleine Wereld en Basisschool 't Kompas—zij gebruiken de verhalen als avondritueel-tip voor ouders.

Zal ik 2 korte voorbeelden sturen?

Michel`,
        delay: 3,
        delay_unit: 'days'
    },

    email3: {
        subject: 'Re: {{subject_a}}',
        body: `Hoi,

Nog steeds geïnteresseerd in oudercommunicatie-tools?

Veel scholen en KDV's sturen wekelijks een tip aan ouders via hun nieuwsbrief. Een gepersonaliseerd bedtijdverhaal werkt daar goed voor.

Interesse?

Michel`,
        delay: 3,
        delay_unit: 'days'
    },

    email4: {
        subject: 'Re: {{subject_a}}',
        body: `Hoi,

Laatste reminder over Bedtijdavonturen.

Als het niet relevant is, helemaal prima—laat het me even weten, dan stop ik.

Anders: zal ik voorbeelden sturen?

Michel`,
        delay: 3,
        delay_unit: 'days'
    },

    email5: {
        subject: 'Re: {{subject_a}}',
        body: `Hoi,

Ik stop met mailen—waarschijnlijk geen match op dit moment.

Mocht het in de toekomst wel interessant worden: michel@bedtijdavonturen.nl.

Succes!
Michel`,
        delay: 5,
        delay_unit: 'days'
    }
};

// Campaign Settings
const CAMPAIGN_SETTINGS = {
    stop_on_reply: true,
    stop_on_auto_reply: false,
    email_gap: 120,
    random_wait_max: 60,
    text_only: false,
    first_email_text_only: false,
    link_tracking: true,
    open_tracking: true,
    daily_max_leads: 50,
    prioritize_new_leads: true,
    campaign_schedule: {
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        start_hour: 8,
        end_hour: 18,
        timezone: 'Europe/Amsterdam'
    }
};

/**
 * Get secret from Google Secret Manager
 */
async function getSecret(secretName: string): Promise<string> {
    try {
        console.log(`  Fetching: ${secretName}...`);

        const secret = execSync(
            `gcloud secrets versions access latest --secret=${secretName} --project=${PROJECT_ID}`,
            { encoding: 'utf-8' }
        ).trim();

        return secret;
    } catch (error: any) {
        console.error(`  ❌ Failed to fetch ${secretName}:`, error.message);
        throw error;
    }
}

/**
 * Make authenticated API request
 */
async function apiRequest(
    apiKey: string,
    method: string,
    endpoint: string,
    data: any = null
) {
    const url = `${INSTANTLY_BASE_URL}${endpoint}`;

    try {
        const response = await axios({
            method,
            url,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            data
        });

        return response.data;
    } catch (error: any) {
        console.error(`  API Error (${endpoint}):`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Get campaign details
 */
async function getCampaign(apiKey: string, campaignId: string) {
    return await apiRequest(apiKey, 'GET', `/campaigns/${campaignId}`);
}

/**
 * Update campaign with V10.1 sequence
 */
async function updateCampaignSequence(
    apiKey: string,
    campaignId: string,
    campaignName: string
) {
    console.log(`\n📧 Updating ${campaignName} campaign sequence...`);

    // Build sequences array (Instantly V2 format with variants)
    const sequences = [{
        steps: [
            {
                type: 'email',
                delay: 0,
                delay_unit: 'days',
                variants: [
                    {
                        subject: EMAIL_TEMPLATES.email1.subject,
                        body: EMAIL_TEMPLATES.email1.body,
                        v_disabled: false
                    },
                    // A/B test variant (subject_b)
                    {
                        subject: EMAIL_TEMPLATES.email1.subject_alt,
                        body: EMAIL_TEMPLATES.email1.body,
                        v_disabled: false
                    }
                ]
            },
            {
                type: 'email',
                delay: EMAIL_TEMPLATES.email2.delay,
                delay_unit: EMAIL_TEMPLATES.email2.delay_unit,
                variants: [
                    {
                        subject: EMAIL_TEMPLATES.email2.subject,
                        body: EMAIL_TEMPLATES.email2.body,
                        v_disabled: false
                    }
                ]
            },
            {
                type: 'email',
                delay: EMAIL_TEMPLATES.email3.delay,
                delay_unit: EMAIL_TEMPLATES.email3.delay_unit,
                variants: [
                    {
                        subject: EMAIL_TEMPLATES.email3.subject,
                        body: EMAIL_TEMPLATES.email3.body,
                        v_disabled: false
                    }
                ]
            },
            {
                type: 'email',
                delay: EMAIL_TEMPLATES.email4.delay,
                delay_unit: EMAIL_TEMPLATES.email4.delay_unit,
                variants: [
                    {
                        subject: EMAIL_TEMPLATES.email4.subject,
                        body: EMAIL_TEMPLATES.email4.body,
                        v_disabled: false
                    }
                ]
            },
            {
                type: 'email',
                delay: EMAIL_TEMPLATES.email5.delay,
                delay_unit: EMAIL_TEMPLATES.email5.delay_unit,
                variants: [
                    {
                        subject: EMAIL_TEMPLATES.email5.subject,
                        body: EMAIL_TEMPLATES.email5.body,
                        v_disabled: false
                    }
                ]
            }
        ]
    }];

    // Update campaign (exclude schedule to avoid API validation issues)
    const { campaign_schedule, ...settingsWithoutSchedule } = CAMPAIGN_SETTINGS;

    const payload = {
        sequences,
        ...settingsWithoutSchedule
    };

    await apiRequest(apiKey, 'PATCH', `/campaigns/${campaignId}`, payload);

    console.log(`  ✅ Sequence updated (5 emails)`);
    console.log(`  ✅ Settings applied`);
}

/**
 * Validate campaign configuration
 */
async function validateCampaign(
    apiKey: string,
    campaignId: string,
    campaignName: string
) {
    console.log(`\n🔍 Validating ${campaignName}...`);

    const campaign = await getCampaign(apiKey, campaignId);

    const sequenceCount = campaign.sequences?.[0]?.steps?.length || 0;
    const checks = {
        sequenceCount: sequenceCount === 5,
        stopOnReply: campaign.stop_on_reply === true
    };

    console.log(`  Emails: ${sequenceCount}/5 ${checks.sequenceCount ? '✅' : '❌'}`);
    console.log(`  Stop on reply: ${checks.stopOnReply ? '✅' : '❌'}`);
    console.log(`  Status: ${campaign.status === 0 ? 'Draft' : campaign.status === 1 ? 'Active ✅' : 'Paused'}`);

    return checks.sequenceCount && checks.stopOnReply;
}

/**
 * Activate (launch) a campaign
 */
async function activateCampaign(
    apiKey: string,
    campaignId: string,
    campaignName: string
) {
    console.log(`\n🚀 Activating ${campaignName} campaign...`);

    try {
        await apiRequest(apiKey, 'POST', `/campaigns/${campaignId}/activate`, {});
        console.log(`  ✅ Campaign activated!`);
        return true;
    } catch (error: any) {
        console.error(`  ❌ Activation failed:`, error.response?.data || error.message);
        return false;
    }
}


/**
 * Main execution
 */
async function main() {
    console.log('🚀 Instantly.ai V10.1 Campaign Update\n');
    console.log('Using Google Secret Manager for credentials\n');
    console.log('================================================\n');

    // Fetch secrets
    console.log('📦 Fetching secrets from GSM...\n');

    const [apiKey, campaignKdv, campaignSchool, campaignPro] = await Promise.all([
        getSecret(SECRET_NAMES.apiKey),
        getSecret(SECRET_NAMES.campaignKdv),
        getSecret(SECRET_NAMES.campaignSchool),
        getSecret(SECRET_NAMES.campaignPro)
    ]);

    console.log('  ✅ All secrets fetched\n');

    const campaigns = {
        KDV: campaignKdv,
        SCHOOL: campaignSchool,
        PRO: campaignPro
    };

    const results: Record<string, boolean> = {};

    // Update each campaign
    for (const [name, campaignId] of Object.entries(campaigns)) {
        try {
            await updateCampaignSequence(apiKey, campaignId, name);
            const valid = await validateCampaign(apiKey, campaignId, name);

            if (valid) {
                const activated = await activateCampaign(apiKey, campaignId, name);
                results[name] = activated;
            } else {
                console.log(`  ⚠️  Skipping activation - validation failed`);
                results[name] = false;
            }
        } catch (error: any) {
            console.error(`\n❌ Failed to update ${name}:`, error.message);
            results[name] = false;
        }
    }

    // Summary
    console.log('\n================================================');
    console.log('📊 Update Summary\n');

    for (const [campaign, success] of Object.entries(results)) {
        const emoji = success ? '✅' : '❌';
        console.log(`  ${emoji} ${campaign}: ${success ? 'Updated' : 'Failed'}`);
    }

    const allSuccess = Object.values(results).every(s => s);

    if (allSuccess) {
        console.log('\n🎉 All campaigns updated and activated successfully!');
        console.log('\nV10.1 sequence now LIVE:');
        console.log('  • Email #1: Dynamic (GPT-generated)');
        console.log('  • Email #2: Social proof (3 days)');
        console.log('  • Email #3: Use case (6 days)');
        console.log('  • Email #4: Opt-out offer (9 days)');
        console.log('  • Email #5: Breakup (14 days)');
        console.log('\n⚠️  Remember to set campaign schedules in Instantly UI!');
    } else {
        console.log('\n⚠️  Some campaigns failed - check logs above');
    }

    console.log('\n================================================\n');
}

// Run
main().catch(error => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
});
