import axios from 'axios';

async function listAllCampaigns() {
    const apiKey = process.env.INSTANTLY_API_KEY;

    if (!apiKey) {
        console.error('❌ INSTANTLY_API_KEY environment variable not set');
        process.exit(1);
    }

    try {
        const response = await axios.get('https://api.instantly.ai/api/v2/campaigns', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        const data = response.data;

        // Handle different response formats
        let campaigns: any[] = [];
        if (Array.isArray(data)) {
            campaigns = data;
        } else if (data.campaigns && Array.isArray(data.campaigns)) {
            campaigns = data.campaigns;
        } else if (typeof data === 'object' && data.id) {
            // Single campaign returned as object
            campaigns = [data];
        } else {
            console.log('Unexpected response format:');
            console.log(JSON.stringify(data, null, 2));
            return;
        }

        console.log(`\n📊 Total Campaigns: ${campaigns.length}\n`);

        campaigns.forEach((campaign: any, index: number) => {
            const statusText = campaign.status === 1 ? '✅ Active' :
                campaign.status === 2 ? '⏸️  Paused' : '❓ Unknown';

            console.log(`${index + 1}. ${campaign.name}`);
            console.log(`   ID: ${campaign.id}`);
            console.log(`   Status: ${statusText}`);
            console.log(`   Warmup: ${campaign.warmup_status || 'N/A'}`);
            console.log(`   Warmup Completed: ${campaign.warmup_completed || 'No'}`);
            console.log(`   Leads: ${campaign.leads_count || 0}`);
            console.log(`   Emails: ${campaign.sequences?.length || 0}`);
            console.log(`   Stop on Reply: ${campaign.stop_on_reply ? 'Yes' : 'No'}`);
            console.log('');
        });

    } catch (error: any) {
        console.error('❌ Error fetching campaigns:', error.response?.data || error.message);
        process.exit(1);
    }
}

listAllCampaigns();
