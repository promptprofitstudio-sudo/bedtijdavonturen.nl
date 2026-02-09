import axios from 'axios';

async function verifyDeletion() {
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
        const campaigns = data.campaigns || [];

        console.log('\n✅ Current Campaigns in Account:\n');

        campaigns.forEach((campaign: any, index: number) => {
            console.log(`${index + 1}. ${campaign.name}`);
            console.log(`   ID: ${campaign.id}`);
            console.log(`   Status: ${campaign.status === 1 ? 'Active' : campaign.status === 2 ? 'Paused' : campaign.status === 3 ? 'Completed' : 'Draft'}`);
            console.log('');
        });

        console.log(`\n📊 Total Campaigns: ${campaigns.length}`);

        // Check if legacy campaign exists
        const legacyId = 'b814e32b-7ae4-421e-930c-0b110eb899e8';
        const legacyExists = campaigns.some((c: any) => c.id === legacyId);

        if (legacyExists) {
            console.log('\n❌ Legacy campaign STILL EXISTS');
        } else {
            console.log('\n✅ Legacy campaign "Bedtijdavonturen Partner Outreach (Automated)" successfully deleted!');
        }

    } catch (error: any) {
        console.error('❌ Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

verifyDeletion();
