#!/usr/bin/env tsx
/**
 * Timezone Test Script for Instantly.ai
 * Tests different timezone formats to find valid ones
 */

import axios from 'axios';

const INSTANTLY_API_KEY = 'NWY2ZDUxMDItZjEwMS00MGVkLTk4ZTItZGU4N2Q1NjhkNTUyOmZSS1JhR3dEeVZaZQ==';

const timezones = [
    'UTC',
    'Etc/UTC',
    'Etc/GMT',
    'Etc/GMT+0',
    'Etc/GMT-0',
    'Etc/GMT+1',  // Amsterdam should be -1, but Etc/ is inverted
    'Etc/GMT-1',  // Try both
    'Etc/GMT+12',
    'Europe/Amsterdam',
    'CET',
    'CEST',
];

async function testTimezone(tz: string) {
    try {
        const response = await axios.post(
            'https://api.instantly.ai/api/v2/campaigns',
            {
                name: `Timezone Test - ${tz}`,
                campaign_schedule: {
                    schedules: [{
                        name: 'Test Schedule',
                        timing: { from: '09:00', to: '17:00' },
                        days: { '1': true, '2': true, '3': true, '4': true, '5': true },
                        timezone: tz
                    }]
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`✅ SUCCESS: ${tz}`);
        console.log(`   Campaign ID: ${response.data.id}\n`);
        return { tz, success: true, id: response.data.id };
    } catch (error: any) {
        const message = error.response?.data?.message || error.message;
        if (message.includes('timezone')) {
            console.log(`❌ INVALID: ${tz} - ${message}`);
        } else {
            console.log(`⚠️  ERROR: ${tz} - ${message}`);
        }
        return { tz, success: false, error: message };
    }
}

async function main() {
    console.log('🧪 Testing timezone formats with Instantly.ai API\n');

    const results = [];
    for (const tz of timezones) {
        const result = await testTimezone(tz);
        results.push(result);
        await new Promise(r => setTimeout(r, 500)); // Rate limit protection
    }

    console.log('\n📊 SUMMARY:');
    console.log('Valid timezones:');
    results.filter(r => r.success).forEach(r => console.log(`  ✅ ${r.tz}`));

    console.log('\nInvalid timezones:');
    results.filter(r => !r.success).forEach(r => console.log(`  ❌ ${r.tz}`));
}

main();
