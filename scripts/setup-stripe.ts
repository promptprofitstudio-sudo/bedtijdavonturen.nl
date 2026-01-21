import Stripe from 'stripe';
import { getSecret } from '../src/lib/firebase/admin';

async function main() {
    const key = process.env.STRIPE_SECRET_KEY || await getSecret('STRIPE_SECRET_KEY');

    if (!key) {
        console.error('Please provide STRIPE_SECRET_KEY in your environment or GSM.');
        process.exit(1);
    }

    const stripe = new Stripe(key, {
        apiVersion: '2025-12-15.clover' as any, // Cast to any if types are still fighting, but this matches the error message
    });

    console.log('Initializing Stripe Products...');

    // 1. Weekend Bundel (One-time)
    const weekendProduct = await stripe.products.create({
        name: 'Weekend Bundel',
        description: '3 Verhalen in het weekend',
        metadata: {
            key: 'weekend_bundle'
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

    console.log(`Created Weekend Bundel: Product ${weekendProduct.id}, Price ${weekendPrice.id}`);

    // 2. Premium (Subscription)
    const premiumProduct = await stripe.products.create({
        name: 'Bedtijd Avonturen Premium',
        description: 'Onbeperkt verhalen en audio',
        metadata: {
            key: 'premium_subscription'
        }
    });

    const monthlyPrice = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 999, // 9.99
        currency: 'eur',
        recurring: {
            interval: 'month'
        },
        metadata: {
            key: 'monthly_price'
        }
    });

    const annualPrice = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 9900, // 99.00
        currency: 'eur',
        recurring: {
            interval: 'year'
        },
        metadata: {
            key: 'annual_price'
        }
    });

    console.log(`Created Premium: Product ${premiumProduct.id}`);
    console.log(` - Monthly Price: ${monthlyPrice.id}`);
    console.log(` - Annual Price: ${annualPrice.id}`);

    console.log('\n--- CONFIGURATION ---');
    console.log('Add these to your .env or constants:');
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_WEEKEND=${weekendPrice.id}`);
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=${monthlyPrice.id}`);
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=${annualPrice.id}`);
}

main().catch(console.error);
