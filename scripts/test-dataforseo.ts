/**
 * Test DataForSEO API Direct
 * Diagnoses why Partner Hunter V4 discovered 0 businesses
 */

import axios from 'axios';
import { execSync } from 'child_process';

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'bedtijdavonturen-prod';

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

async function testDataForSEO() {
    console.log('🧪 Testing DataForSEO API\n');

    const login = getSecret('DATAFORSEO_LOGIN');
    const apiKey = getSecret('DATAFORSEO_API_KEY');

    console.log('✅ Credentials fetched\n');
    console.log(`Login: ${login.substring(0, 5)}...`);
    console.log(`API Key: ${apiKey.substring(0, 10)}...\n`);

    const auth = Buffer.from(`${login}:${apiKey}`).toString('base64');

    const testQuery = {
        location_name: 'Amsterdam, Netherlands',
        keyword: 'kinderopvang',
        language_code: 'nl'
    };

    console.log('📤 Sending test request...');
    console.log('Query:', JSON.stringify(testQuery, null, 2), '\n');

    try {
        const response = await axios.post(
            'https://api.dataforseo.com/v3/serp/google/maps/live/advanced',
            [testQuery],
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ API Response Received\n');
        console.log('Full Response:');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('\n---\n');

        const task = response.data.tasks?.[0];
        if (!task) {
            console.error('❌ No tasks in response');
            return;
        }

        if (task.status_code !== 20000) {
            console.error(`❌ Task failed with status: ${task.status_code}`);
            console.error('Message:', task.status_message);
            return;
        }

        const items = task.result?.[0]?.items || [];
        console.log(`📍 Found ${items.length} results\n`);

        if (items.length > 0) {
            console.log('Sample results:');
            items.slice(0, 3).forEach((item: any, i: number) => {
                console.log(`\n${i + 1}. ${item.title}`);
                console.log(`   URL: ${item.url}`);
                console.log(`   Rating: ${item.rating || 'N/A'} (${item.reviews_count || 0} reviews)`);
            });
        } else {
            console.log('⚠️  PROBLEM: No items returned');
            console.log('\nPossible causes:');
            console.log('1. API quota exhausted');
            console.log('2. Account suspended or payment failed');
            console.log('3. Search query format not recognized');
            console.log('4. Location name issue');
            console.log('\nCheck DataForSEO dashboard: https://app.dataforseo.com/');
        }

        // Check cost
        const cost = task.cost || 0;
        console.log(`\n💰 API Call Cost: $${cost}`);

    } catch (error: any) {
        console.error('❌ API Error\n');
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
testDataForSEO().catch(err => {
    console.error('\nScript failed:', err.message);
    process.exit(1);
});
