import axios from 'axios';

/**
 * Retrieve the Pro_Outreach campaign to see what timezone format it uses
 * This will help us understand the correct timezone identifier
 */

const PRO_CAMPAIGN_ID = '66361665-6bae-491e-b041-c64403e90f14';
const KDV_CAMPAIGN_ID = 'fa2c0cdc-1147-4750-a74c-904b4b39e26f';

async function inspectTimezones() {
    const apiKey = process.env.INSTANTLY_API_KEY;

    if (!apiKey) {
        console.error('❌ INSTANTLY_API_KEY environment variable not set');
        process.exit(1);
    }

    console.log('🔍 Inspecting timezone formats from working campaigns...\n');

    try {
        // Check Pro campaign
        console.log('📥 Fetching Pro_Outreach campaign...');
        const proResponse = await axios.get(
            `https://api.instantly.ai/api/v2/campaigns/${PRO_CAMPAIGN_ID}`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        const proCampaign = proResponse.data;
        console.log(`✅ Pro_Outreach`);
        if (proCampaign.campaign_schedule?.schedules?.[0]) {
            console.log(`   Timezone: ${proCampaign.campaign_schedule.schedules[0].timezone}`);
            console.log(`   Format: ${typeof proCampaign.campaign_schedule.schedules[0].timezone}`);
        } else {
            console.log('   No schedule found');
        }

        // Check KDV campaign
        console.log('\n📥 Fetching KDV_Outreach campaign...');
        const kdvResponse = await axios.get(
            `https://api.instantly.ai/api/v2/campaigns/${KDV_CAMPAIGN_ID}`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        const kdvCampaign = kdvResponse.data;
        console.log(`✅ KDV_Outreach`);
        if (kdvCampaign.campaign_schedule?.schedules?.[0]) {
            console.log(`   Timezone: ${kdvCampaign.campaign_schedule.schedules[0].timezone}`);
            console.log(`   Format: ${typeof kdvCampaign.campaign_schedule.schedules[0].timezone}`);
        } else {
            console.log('   No schedule found');
        }

        // Compare to School
        console.log('\n📋 Analysis:');
        console.log('   Pro timezone:', proCampaign.campaign_schedule?.schedules?.[0]?.timezone || 'N/A');
        console.log('   KDV timezone:', kdvCampaign.campaign_schedule?.schedules?.[0]?.timezone || 'N/A');
        console.log('   School current: Etc/GMT+12');
        console.log('\n💡 The correct timezone format appears to be the one used by Pro/KDV');

    } catch (error: any) {
        console.error('❌ Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

inspectTimezones();
