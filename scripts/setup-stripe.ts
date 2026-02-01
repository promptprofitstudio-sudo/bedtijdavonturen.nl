import Stripe from 'stripe';
import { getSecret } from '../src/lib/secrets';

async function main() {
    console.log('--- STRIPE FRESH START ---');

    // 1. Initialize Stripe
    const key = await getSecret('STRIPE_SECRET_KEY');

    if (!key) {
        console.error('❌ CRITICAL: STRIPE_SECRET_KEY is missing in GSM.');
        process.exit(1);
    }

    const stripe = new Stripe(key, {
        apiVersion: '2025-12-15.clover' as any,
    });

    // 2. Archive EXISTING Products (The "Delete" Phase)
    console.log('\n🗑️  Cleaning up existing products...');
    const existingProducts = await stripe.products.list({ limit: 100, active: true });

    if (existingProducts.data.length > 0) {
        console.log(`Found ${existingProducts.data.length} active products. Archiving...`);
        for (const product of existingProducts.data) {
            await stripe.products.update(product.id, { active: false });
            console.log(`   - Archived: ${product.name} (${product.id})`);
        }
    } else {
        console.log('   - No active products found (already clean).');
    }

    // 3. Create NEW Products (The "Re-create" Phase)
    console.log('\n✨ Creating new products...');

    // A. Weekend Bundel (One-time)
    const weekendProduct = await stripe.products.create({
        name: 'Weekend Bundel',
        description: '3 Verhalen in het weekend',
        metadata: {
            key: 'weekend_bundle',
            environment: 'prod_v2_fresh'
        }
    });

    const weekendPrice = await stripe.prices.create({
        product: weekendProduct.id,
        unit_amount: 199, // 1.99
        currency: 'eur',
        metadata: {
            key: 'weekend_price'
        }
    });

    console.log(`✅ Created Weekend Bundel: ${weekendProduct.id}`);

    // B. Premium (Subscription)
    const premiumProduct = await stripe.products.create({
        name: 'Bedtijd Avonturen Premium',
        description: 'Onbeperkt verhalen en audio',
        metadata: {
            key: 'premium_subscription',
            environment: 'prod_v2_fresh'
        }
    });

    const monthlyPrice = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 999, // 9.99
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: { key: 'monthly_price' }
    });

    const annualPrice = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 9900, // 99.00
        currency: 'eur',
        recurring: { interval: 'year' },
        metadata: { key: 'annual_price' }
    });

    console.log(`✅ Created Premium Subscription: ${premiumProduct.id}`);

    // 4. Output Configuration
    console.log('\n--- 📝 UPDATE .env.local ---');
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_WEEKEND=${weekendPrice.id}`);
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=${monthlyPrice.id}`);
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=${annualPrice.id}`);
    console.log('----------------------------\n');
}

main().catch(console.error);
