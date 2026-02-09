/**
 * Instantly.ai Campaign Auto-Setup Script (V10.1)
 * 
 * Programmatically configures 5-email sequences via Instantly API V2
 * 
 * Usage:
 * 1. Set INSTANTLY_API_KEY environment variable
 * 2. Run: node setup-instantly-campaigns.js
 */

const axios = require('axios');

// Configuration
const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY || 'YOUR_API_KEY_HERE';
const INSTANTLY_BASE_URL = 'https://api.instantly.ai/api/v2';

// Campaign IDs (from Firebase secrets)
const CAMPAIGNS = {
    kdv: process.env.INSTANTLY_CAMPAIGN_KDV,
    school: process.env.INSTANTLY_CAMPAIGN_SCHOOL,
    pro: process.env.INSTANTLY_CAMPAIGN_PRO
};

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
        delay: 0, // Immediate (first email)
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
        delay: 5,  // Breakup needs longer gap
        delay_unit: 'days'
    }
};

// Campaign Settings
const CAMPAIGN_SETTINGS = {
    stop_on_reply: true,
    stop_on_auto_reply: false,
    email_gap: 120, // 2 hours between sends (in minutes)
    random_wait_max: 60, // Add up to 1 hour randomization
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
 * Make authenticated API request
 */
async function apiRequest(method, endpoint, data = null) {
    const url = `${INSTANTLY_BASE_URL}${endpoint}`;

    try {
        const response = await axios({
            method,
            url,
            headers: {
                'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            data
        });

        return response.data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Get campaign details
 */
async function getCampaign(campaignId) {
    return await apiRequest('GET', `/campaign/${campaignId}`);
}

/**
 * Update campaign settings
 */
async function updateCampaignSettings(campaignId, settings) {
    console.log(`  Updating campaign settings...`);

    return await apiRequest('PATCH', `/campaign/${campaignId}`, settings);
}

/**
 * Create or update campaign sequence
 */
async function setupCampaignSequence(campaignId, campaignName) {
    console.log(`\n📧 Setting up ${campaignName} campaign sequence...`);

    // Build sequences array
    const sequences = [{
        steps: [
            {
                type: 'email',
                subject: EMAIL_TEMPLATES.email1.subject,
                subject_alt: EMAIL_TEMPLATES.email1.subject_alt,
                body: EMAIL_TEMPLATES.email1.body,
                delay: EMAIL_TEMPLATES.email1.delay,
                delay_unit: EMAIL_TEMPLATES.email1.delay_unit
            },
            {
                type: 'email',
                subject: EMAIL_TEMPLATES.email2.subject,
                body: EMAIL_TEMPLATES.email2.body,
                delay: EMAIL_TEMPLATES.email2.delay,
                delay_unit: EMAIL_TEMPLATES.email2.delay_unit
            },
            {
                type: 'email',
                subject: EMAIL_TEMPLATES.email3.subject,
                body: EMAIL_TEMPLATES.email3.body,
                delay: EMAIL_TEMPLATES.email3.delay,
                delay_unit: EMAIL_TEMPLATES.email3.delay_unit
            },
            {
                type: 'email',
                subject: EMAIL_TEMPLATES.email4.subject,
                body: EMAIL_TEMPLATES.email4.body,
                delay: EMAIL_TEMPLATES.email4.delay,
                delay_unit: EMAIL_TEMPLATES.email4.delay_unit
            },
            {
                type: 'email',
                subject: EMAIL_TEMPLATES.email5.subject,
                body: EMAIL_TEMPLATES.email5.body,
                delay: EMAIL_TEMPLATES.email5.delay,
                delay_unit: EMAIL_TEMPLATES.email5.delay_unit
            }
        ]
    }];

    // Update campaign with sequences + settings
    const payload = {
        sequences,
        ...CAMPAIGN_SETTINGS
    };

    await updateCampaignSettings(campaignId, payload);

    console.log(`  ✅ Sequence configured (5 emails)`);
    console.log(`  ✅ Settings applied (stop_on_reply, schedule, etc.)`);
}

/**
 * Validate campaign configuration
 */
async function validateCampaign(campaignId, campaignName) {
    console.log(`\n🔍 Validating ${campaignName} configuration...`);

    const campaign = await getCampaign(campaignId);

    const checks = {
        sequenceCount: campaign.sequences?.[0]?.steps?.length === 5,
        stopOnReply: campaign.stop_on_reply === true,
        emailGap: campaign.email_gap === 120,
        schedule: campaign.campaign_schedule?.days?.length === 5
    };

    console.log(`  Sequence emails: ${campaign.sequences?.[0]?.steps?.length}/5 ✅`);
    console.log(`  Stop on reply: ${checks.stopOnReply ? '✅' : '❌'}`);
    console.log(`  Email gap: ${campaign.email_gap} min ${checks.emailGap ? '✅' : '⚠️'}`);
    console.log(`  Schedule: ${campaign.campaign_schedule?.days?.length} days ${checks.schedule ? '✅' : '❌'}`);

    const allPassed = Object.values(checks).every(check => check);

    if (allPassed) {
        console.log(`  ✅ All validation checks passed!`);
    } else {
        console.log(`  ⚠️  Some checks failed - review manually`);
    }

    return allPassed;
}

/**
 * Main execution
 */
async function main() {
    console.log('🚀 Instantly.ai Campaign Auto-Setup (V10.1)\n');
    console.log('================================================\n');

    // Validate API key
    if (!INSTANTLY_API_KEY || INSTANTLY_API_KEY === 'YOUR_API_KEY_HERE') {
        console.error('❌ Error: INSTANTLY_API_KEY not set');
        console.log('\nSet it via:');
        console.log('  export INSTANTLY_API_KEY=your_key_here');
        process.exit(1);
    }

    // Validate campaign IDs
    const missingCampaigns = Object.entries(CAMPAIGNS)
        .filter(([_, id]) => !id)
        .map(([name, _]) => name);

    if (missingCampaigns.length > 0) {
        console.error(`❌ Missing campaign IDs: ${missingCampaigns.join(', ')}`);
        console.log('\nSet them via environment variables:');
        console.log('  export INSTANTLY_CAMPAIGN_KDV=your_campaign_id');
        console.log('  export INSTANTLY_CAMPAIGN_SCHOOL=your_campaign_id');
        console.log('  export INSTANTLY_CAMPAIGN_PRO=your_campaign_id');
        process.exit(1);
    }

    const results = {};

    // Setup each campaign
    for (const [name, campaignId] of Object.entries(CAMPAIGNS)) {
        try {
            await setupCampaignSequence(campaignId, name.toUpperCase());
            const valid = await validateCampaign(campaignId, name.toUpperCase());
            results[name] = valid ? 'success' : 'warning';
        } catch (error) {
            console.error(`\n❌ Failed to setup ${name.toUpperCase()} campaign:`, error.message);
            results[name] = 'failed';
        }
    }

    // Final summary
    console.log('\n================================================');
    console.log('📊 Setup Summary\n');

    for (const [campaign, status] of Object.entries(results)) {
        const emoji = status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌';
        console.log(`  ${emoji} ${campaign.toUpperCase()}: ${status}`);
    }

    const allSuccess = Object.values(results).every(s => s === 'success');

    if (allSuccess) {
        console.log('\n🎉 All campaigns configured successfully!');
        console.log('\nNext steps:');
        console.log('  1. Log in to Instantly.ai to verify templates');
        console.log('  2. Test with a sample lead');
        console.log('  3. Activate campaigns post-warmup (Feb 23)');
    } else {
        console.log('\n⚠️  Some campaigns need manual review');
        console.log('Check Instantly.ai dashboard for details');
    }

    console.log('\n================================================\n');
}

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('\n❌ Unhandled error:', error.message);
    process.exit(1);
});

// Run
main().catch(error => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
});
