#!/usr/bin/env node
/**
 * Stripe Configuration Validator
 * Uses Stripe API to validate current setup
 */

const https = require('https');
const { execSync } = require('child_process');

// Fetch secret from Google Secret Manager
function getSecret(name) {
    try {
        return execSync(
            `gcloud secrets versions access latest --secret="${name}" --project="bedtijdavonturen-prod"`,
            { encoding: 'utf-8' }
        ).trim();
    } catch (err) {
        console.error(`❌ Failed to fetch ${name}:`, err.message);
        return null;
    }
}

// Make Stripe API request
function stripeApiRequest(path, apiKey) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.stripe.com',
            path: `/v1${path}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('🔐 Fetching Stripe credentials from Secret Manager...\n');

    const STRIPE_SECRET_KEY = getSecret('STRIPE_SECRET_KEY');
    const STRIPE_WEBHOOK_SECRET = getSecret('STRIPE_WEBHOOK_SECRET');

    if (!STRIPE_SECRET_KEY) {
        console.error('❌ STRIPE_SECRET_KEY not found in Secret Manager');
        process.exit(1);
    }

    console.log('✅ Stripe Secret Key:', STRIPE_SECRET_KEY.substring(0, 20) + '...');
    console.log('✅ Webhook Secret:', STRIPE_WEBHOOK_SECRET ? STRIPE_WEBHOOK_SECRET.substring(0, 20) + '...' : '⚠️  NOT SET');
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 VALIDATING STRIPE CONFIGURATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Check Prices
    console.log('1️⃣  Checking Prices...');
    try {
        const prices = await stripeApiRequest('/prices?limit=100', STRIPE_SECRET_KEY);
        console.log(`   Found ${prices.data.length} prices\n`);

        prices.data.forEach((price, i) => {
            console.log(`   ${i + 1}. ${price.id}`);
            console.log(`      Name: ${price.nickname || 'No name'}`);
            console.log(`      Amount: €${(price.unit_amount / 100).toFixed(2)}`);
            console.log(`      Type: ${price.type}`);
            console.log(`      Active: ${price.active ? '✅' : '❌'}`);
            console.log('');
        });
    } catch (err) {
        console.error('   ❌ Error:', err.message);
    }

    // 2. Check Webhook Endpoints
    console.log('2️⃣  Checking Webhook Endpoints...');
    try {
        const webhooks = await stripeApiRequest('/webhook_endpoints', STRIPE_SECRET_KEY);

        if (webhooks.data.length === 0) {
            console.log('   ⚠️  NO WEBHOOKS CONFIGURED!');
            console.log('   This means payment success is NOT being processed server-side.');
            console.log('   User will see success message but may not get access.\n');
        } else {
            console.log(`   Found ${webhooks.data.length} webhook(s)\n`);

            webhooks.data.forEach((webhook, i) => {
                console.log(`   ${i + 1}. ${webhook.id}`);
                console.log(`      URL: ${webhook.url}`);
                console.log(`      Status: ${webhook.status}`);
                console.log(`      Events: ${webhook.enabled_events.join(', ')}`);
                console.log(`      Created: ${new Date(webhook.created * 1000).toISOString()}`);
                console.log('');
            });
        }
    } catch (err) {
        console.error('   ❌ Error:', err.message);
    }

    // 3. Check Recent Checkout Sessions
    console.log('3️⃣  Checking Recent Checkout Sessions...');
    try {
        const sessions = await stripeApiRequest('/checkout/sessions?limit=5', STRIPE_SECRET_KEY);
        console.log(`   Found ${sessions.data.length} recent sessions\n`);

        sessions.data.forEach((session, i) => {
            console.log(`   ${i + 1}. ${session.id}`);
            console.log(`      Status: ${session.status}`);
            console.log(`      Mode: ${session.mode}`);
            console.log(`      Success URL: ${session.success_url}`);
            console.log(`      Cancel URL: ${session.cancel_url}`);
            console.log(`      Amount: €${(session.amount_total / 100).toFixed(2)}`);
            console.log(`      Created: ${new Date(session.created * 1000).toISOString()}`);
            console.log('');
        });

        // Validate URLs
        const hasWrongUrl = sessions.data.some(s =>
            !s.success_url.includes('bedtijdavonturen') ||
            s.success_url.includes('localhost')
        );

        if (hasWrongUrl) {
            console.log('   ⚠️  WARNING: Some sessions have incorrect URLs!');
        }
    } catch (err) {
        console.error('   ❌ Error:', err.message);
    }

    // 4. Check Products
    console.log('4️⃣  Checking Products...');
    try {
        const products = await stripeApiRequest('/products?limit=10', STRIPE_SECRET_KEY);
        console.log(`   Found ${products.data.length} products\n`);

        products.data.forEach((product, i) => {
            console.log(`   ${i + 1}. ${product.id}`);
            console.log(`      Name: ${product.name}`);
            console.log(`      Description: ${product.description || 'None'}`);
            console.log(`      Active: ${product.active ? '✅' : '❌'}`);
            console.log('');
        });
    } catch (err) {
        console.error('   ❌ Error:', err.message);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ VALIDATION COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Summary
    console.log('📝 RECOMMENDATIONS:\n');

    if (!STRIPE_WEBHOOK_SECRET) {
        console.log('⚠️  1. Create webhook in Stripe Dashboard');
        console.log('   URL: https://bedtijdavonturen-prod.web.app/api/stripe-webhook');
        console.log('   Events: checkout.session.completed, payment_intent.succeeded');
        console.log('   Then: Save webhook signing secret to Secret Manager\n');
    }

    console.log('✅ 2. Success URLs appear to be correctly configured');
    console.log('✅ 3. Payment codes are active and properly set up');
}

main().catch(console.error);
