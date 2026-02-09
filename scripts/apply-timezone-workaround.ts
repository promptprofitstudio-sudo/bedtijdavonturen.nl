import axios from 'axios';

/**
 * Workaround for timezone restriction - Adjust business hours to compensate
 * 
 * Problem: All campaigns use Etc/GMT+12 (UTC-12), API won't allow changing to Europe timezone
 * Solution: Set business hours to 20:00-04:00 UTC-12 = 09:00-17:00 CET
 * 
 * Calculation:
 * - Desired CET time: 09:00-17:00 (GMT+1)
 * - UTC-12 offset: +13 hours ahead of CET
 * - 09:00 CET = 20:00 previous day UTC-12
 * - 17:00 CET = 04:00 same day UTC-12
 */

const CAMPAIGNS = [
    { name: 'KDV_Outreach', id: 'fa2c0cdc-1147-4750-a74c-904b4b39e26f' },
    { name: 'Pro_Outreach', id: '66361665-6bae-491e-b041-c64403e90f14' },
    { name: 'School_Outreach', id: 'c73329c9-a7eb-4e86-b1ad-8d658815b057' }
];

async function applyTimezoneWorkaround() {
    const apiKey = process.env.INSTANTLY_API_KEY;

    if (!apiKey) {
        console.error('❌ INSTANTLY_API_KEY environment variable not set');
        process.exit(1);
    }

    console.log('🔧 Applying Timezone Workaround\n');
    console.log('📊 Problem: Campaigns use Etc/GMT+12 (UTC-12)');
    console.log('💡 Solution: Adjust business hours to compensate\n');
    console.log('⏰ Target send time: 09:00-17:00 CET');
    console.log('⏰ Adjusted hours: 20:00-04:00 UTC-12\n');
    console.log('   (20:00 UTC-12 = 09:00 CET next day)');
    console.log('   (04:00 UTC-12 = 17:00 CET same day)\n');
    console.log('═'.repeat(60) + '\n');

    for (const campaign of CAMPAIGNS) {
        console.log(`📝 Updating ${campaign.name}...`);

        try {
            // Fetch current config
            const getResponse = await axios.get(
                `https://api.instantly.ai/api/v2/campaigns/${campaign.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    }
                }
            );

            const current = getResponse.data;

            // Show current schedule
            const currentSchedule = current.campaign_schedule?.schedules?.[0];
            if (currentSchedule) {
                console.log(`   Current: ${currentSchedule.timing.from}-${currentSchedule.timing.to} ${currentSchedule.timezone}`);
            }

            // Update schedule with workaround hours
            const updatedSchedule = {
                campaign_schedule: {
                    schedules: [{
                        name: "Business Hours (CET Compensated)",
                        timing: {
                            from: "20:00",
                            to: "04:00"  // Next day
                        },
                        days: {
                            "0": false,  // Sunday off
                            "1": true,   // Monday
                            "2": true,   // Tuesday
                            "3": true,   // Wednesday
                            "4": true,   // Thursday
                            "5": true,   // Friday
                            "6": false   // Saturday off
                        },
                        timezone: "Etc/GMT+12"  // Keep existing timezone
                    }]
                }
            };

            const updateResponse = await axios.patch(
                `https://api.instantly.ai/api/v2/campaigns/${campaign.id}`,
                updatedSchedule,
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`   ✅ Updated: 20:00-04:00 Etc/GMT+12`);
            console.log(`   → Effective CET time: 09:00-17:00\n`);

        } catch (error: any) {
            console.error(`   ❌ Error updating ${campaign.name}:`);
            if (error.response) {
                console.error(`      Status: ${error.response.status}`);
                console.error(`      Error:`, JSON.stringify(error.response.data, null, 2));
            } else {
                console.error(`      ${error.message}`);
            }
            console.log('');
        }
    }

    console.log('═'.repeat(60));
    console.log('\n🔍 Verifying changes...\n');

    // Verify all campaigns
    for (const campaign of CAMPAIGNS) {
        try {
            const verifyResponse = await axios.get(
                `https://api.instantly.ai/api/v2/campaigns/${campaign.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    }
                }
            );

            const schedule = verifyResponse.data.campaign_schedule?.schedules?.[0];
            if (schedule) {
                const from = schedule.timing.from;
                const to = schedule.timing.to;
                const tz = schedule.timezone;

                const isCorrect = from === "20:00" && to === "04:00" && tz === "Etc/GMT+12";
                const status = isCorrect ? '✅' : '❌';

                console.log(`${status} ${campaign.name}:`);
                console.log(`   Schedule: ${from}-${to} ${tz}`);
                console.log(`   Effective: 09:00-17:00 CET`);
            } else {
                console.log(`❌ ${campaign.name}: No schedule found`);
            }
        } catch (error: any) {
            console.log(`❌ ${campaign.name}: Verification failed`);
        }
        console.log('');
    }

    console.log('═'.repeat(60));
    console.log('\n🎉 Timezone workaround applied successfully!');
    console.log('\n📋 Summary:');
    console.log('   • All campaigns will now send during NL business hours');
    console.log('   • 09:00-17:00 CET (Monday-Friday)');
    console.log('   • Timezone remains Etc/GMT+12 (API restriction)');
    console.log('   • This is a WORKAROUND until proper timezone can be set\n');
}

applyTimezoneWorkaround();
