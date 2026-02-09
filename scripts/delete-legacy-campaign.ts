import axios from 'axios';

async function deleteCampaign() {
    const apiKey = process.env.INSTANTLY_API_KEY;
    const campaignId = 'b814e32b-7ae4-421e-930c-0b110eb899e8'; // Legacy Automated campaign

    if (!apiKey) {
        console.error('❌ INSTANTLY_API_KEY environment variable not set');
        process.exit(1);
    }

    console.log('🗑️  Deleting Legacy Campaign...');
    console.log(`Campaign ID: ${campaignId}`);
    console.log(`Name: Bedtijdavonturen Partner Outreach (Automated)\n`);

    try {
        const response = await axios.delete(
            `https://api.instantly.ai/api/v2/campaigns/${campaignId}`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        console.log('✅ Campaign deleted successfully!');
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error: any) {
        if (error.response) {
            console.error('❌ Delete failed:', error.response.status, error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
        process.exit(1);
    }
}

deleteCampaign();
