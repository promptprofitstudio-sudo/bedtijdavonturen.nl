import axios from 'axios';

/**
 * Try different timezone formats to find which one Instantly accepts for Europe
 * Common formats: Europe/Amsterdam, CET, GMT+1, Etc/GMT-1 (note: Etc/GMT is inverted!)
 */

const SCHOOL_CAMPAIGN_ID = 'c73329c9-a7eb-4e86-b1ad-8d658815b057';

// Etc/GMT notation is INVERTED! 
// GMT+1 (CET) = Etc/GMT-1
// GMT+2 (CEST) = Etc/GMT-2
const TIMEZONE_OPTIONS = [
    'Etc/GMT-1',  // CET (GMT+1) - Most likely correct!
    'Etc/GMT-2',  // CEST (GMT+2) - Summer time
    'Europe/Amsterdam',
    'CET',
    'GMT+1'
];

async function testTimezones() {
    const apiKey = process.env.INSTANTLY_API_KEY;

    if (!apiKey) {
        console.error('❌ INSTANTLY_API_KEY environment variable not set');
        process.exit(1);
    }

    console.log('🧪 Testing timezone formats...\n');
    console.log('ℹ️  Note: Etc/GMT notation is inverted!');
    console.log('   GMT+1 (CET) = Etc/GMT-1 ✅');
    console.log('   GMT-12 (current wrong setting) = Etc/GMT+12 ❌\n');

    for (const timezone of TIMEZONE_OPTIONS) {
        console.log(`📝 Testing: ${timezone}`);

        try {
            // Try to update with this timezone
            const payload = {
                campaign_schedule: {
                    schedules: [{
                        name: "Business Hours (NL)",
                        timing: { from: "09:00", to: "17:00" },
                        days: {
                            "0": false,
                            "1": true,
                            "2": true,
                            "3": true,
                            "4": true,
                            "5": true,
                            "6": false
                        },
                        timezone: timezone
                    }]
                }
            };

            await axios.patch(
                `https://api.instantly.ai/api/v2/campaigns/${SCHOOL_CAMPAIGN_ID}`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`   ✅ SUCCESS! "${timezone}" is accepted\n`);
            console.log(`🎯 Use this timezone: ${timezone}`);
            return timezone;

        } catch (error: any) {
            if (error.response?.status === 400 && error.response?.data?.message?.includes('allowed values')) {
                console.log(`   ❌ Rejected - not in allowed values\n`);
            } else {
                console.log(`   ❌ Error: ${error.response?.data?.message || error.message}\n`);
            }
        }
    }

    console.log('❌ None of the tested timezones worked');
    console.log('\n💡 Current timezone is: Etc/GMT+12');
    console.log('   This might already be the only allowed value for this account');
}

testTimezones();
