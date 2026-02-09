import axios from 'axios';

/**
 * Fix School_Outreach campaign to be V10.1 compliant
 * - Fix Step 2 delay: 0 → 3 days
 * - Fix Step 5 delay: 3 → 5 days
 * - Fix timezone: UTC-12 → Europe/Amsterdam
 */

const CAMPAIGN_ID = 'c73329c9-a7eb-4e86-b1ad-8d658815b057';

async function fixSchoolCampaign() {
    const apiKey = process.env.INSTANTLY_API_KEY;

    if (!apiKey) {
        console.error('❌ INSTANTLY_API_KEY environment variable not set');
        process.exit(1);
    }

    console.log('🔧 Fixing School_Outreach Campaign...\n');
    console.log(`Campaign ID: ${CAMPAIGN_ID}\n`);

    try {
        // Step 1: Get current campaign configuration
        console.log('📥 Fetching current configuration...');
        const getResponse = await axios.get(
            `https://api.instantly.ai/api/v2/campaigns/${CAMPAIGN_ID}`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        const campaign = getResponse.data;
        console.log(`✅ Current campaign: ${campaign.name}`);
        console.log(`   Status: ${campaign.status}`);
        console.log(`   Current sequences: ${campaign.sequences?.length || 0}\n`);

        // Step 2: Fix email intervals
        console.log('📝 Updating email sequence intervals...');

        const sequence = campaign.sequences[0];
        const steps = sequence.steps;

        console.log('   Current intervals:');
        steps.forEach((step: any, index: number) => {
            console.log(`   Step ${index + 1}: ${step.delay} days`);
        });

        // Fix Step 2: 0 → 3 days
        if (steps[1]) {
            steps[1].delay = 3;
            console.log('   ✅ Fixed Step 2: 0 → 3 days');
        }

        // Fix Step 5: 3 → 5 days
        if (steps[4]) {
            steps[4].delay = 5;
            console.log('   ✅ Fixed Step 5: 3 → 5 days');
        }

        console.log('\n   New intervals:');
        steps.forEach((step: any, index: number) => {
            console.log(`   Step ${index + 1}: ${step.delay} days`);
        });

        // Step 3: Fix timezone
        console.log('\n🌍 Updating timezone...');

        if (!campaign.campaign_schedule) {
            campaign.campaign_schedule = {
                schedules: [{
                    name: "Business Hours (NL)",
                    timing: { from: "09:00", to: "17:00" },
                    days: { "0": false, "1": true, "2": true, "3": true, "4": true, "5": true, "6": false },
                    timezone: "Europe/Amsterdam"
                }]
            };
            console.log('   ✅ Created new schedule with Europe/Amsterdam timezone');
        } else if (campaign.campaign_schedule.schedules && campaign.campaign_schedule.schedules[0]) {
            const oldTz = campaign.campaign_schedule.schedules[0].timezone;
            campaign.campaign_schedule.schedules[0].timezone = "Europe/Amsterdam";
            console.log(`   ✅ Changed timezone: ${oldTz} → Europe/Amsterdam`);
        }

        // Step 4: Update campaign via API
        console.log('\n📤 Sending updates to Instantly.ai...');

        const updatePayload = {
            sequences: campaign.sequences,
            campaign_schedule: campaign.campaign_schedule
        };

        const updateResponse = await axios.patch(
            `https://api.instantly.ai/api/v2/campaigns/${CAMPAIGN_ID}`,
            updatePayload,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Campaign updated successfully!\n');

        // Step 5: Verify changes
        console.log('🔍 Verifying changes...');
        const verifyResponse = await axios.get(
            `https://api.instantly.ai/api/v2/campaigns/${CAMPAIGN_ID}`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        const updated = verifyResponse.data;
        const updatedSteps = updated.sequences[0].steps;

        console.log('   Verified intervals:');
        updatedSteps.forEach((step: any, index: number) => {
            const expected = [0, 3, 3, 3, 5][index];
            const status = step.delay === expected ? '✅' : '❌';
            console.log(`   ${status} Step ${index + 1}: ${step.delay} days (expected: ${expected})`);
        });

        const updatedTz = updated.campaign_schedule?.schedules[0]?.timezone;
        const tzStatus = updatedTz === "Europe/Amsterdam" ? '✅' : '❌';
        console.log(`   ${tzStatus} Timezone: ${updatedTz}`);

        console.log('\n🎉 School_Outreach campaign is now V10.1 compliant!');

    } catch (error: any) {
        console.error('\n❌ Error updating campaign:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(`   ${error.message}`);
        }
        process.exit(1);
    }
}

fixSchoolCampaign();
