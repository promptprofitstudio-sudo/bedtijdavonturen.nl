
import dotenv from 'dotenv'
import Stripe from 'stripe'
import fs from 'fs'
import { getSecret } from '../src/lib/secrets'

dotenv.config({ path: '.env.local' })

async function main() {
    console.log('🚀 Creating v2.1 Prices...')

    const stripeKey = await getSecret('STRIPE_SECRET_KEY')
    if (!stripeKey) {
        console.error('❌ Missing STRIPE_SECRET_KEY (checked env and GSM)')
        process.exit(1)
    }

    const stripe = new Stripe(stripeKey, {
        apiVersion: '2024-12-18.acacia' as any // Force cast or use '2025-12-15.clover' if types demand it, but let's try strict casting to avoid TS noise if possible, or matches user linter feedback.
        // Actually, let's use the one linter suggested:
        // apiVersion: '2025-12-15.clover',
    })

    // 1. Create or Find Products
    // We will just create new Prices. If you want specific Products, we can create them.
    // For simplicity, let's create a "Bedtijdavonturen Credits" product and "Bedtijdavonturen Premium" product if they don't exist, 
    // or just attach to a generic one. Let's create new Products for clarity.

    // A. PRODUCT: Strippenkaart (Credits)
    const productCredits = await stripe.products.create({
        name: 'Bedtijdavonturen Strippenkaart',
        description: '3 Losse Verhalen + Audio',
        images: ['https://bedtijdavonturen.nl/icons/icon-512x512.png'] // generic
    })
    console.log('Created Product: Strippenkaart', productCredits.id)

    // B. PRODUCT: Rust & Regelmaat (Premium)
    const productMonthly = await stripe.products.create({
        name: 'Rust & Regelmaat',
        description: 'Onbeperkt toegang (1 kind)',
        images: ['https://bedtijdavonturen.nl/icons/icon-512x512.png'] // generic
    })
    console.log('Created Product: Rust & Regelmaat', productMonthly.id)

    // C. PRODUCT: Gezin (Family)
    const productFamily = await stripe.products.create({
        name: 'Gezin',
        description: 'Onbeperkt toegang (5 kids + Opa/Oma)',
        images: ['https://bedtijdavonturen.nl/icons/icon-512x512.png'] // generic
    })
    console.log('Created Product: Gezin', productFamily.id)

    // 2. Create Prices

    // Price 1: Strippenkaart (€2,99 One-time)
    const priceWeekend = await stripe.prices.create({
        product: productCredits.id,
        unit_amount: 299, // 2.99 EUR
        currency: 'eur',
        nickname: 'Strippenkaart (3 Credits)',
    })
    console.log('✅ Created PRICE_WEEKEND:', priceWeekend.id)

    // Price 2: Rust & Regelmaat (€7,99 Monthly)
    const priceMonthly = await stripe.prices.create({
        product: productMonthly.id,
        unit_amount: 799,
        currency: 'eur',
        recurring: { interval: 'month' },
        nickname: 'Rust & Regelmaat (Maandelijks)',
    })
    console.log('✅ Created PRICE_MONTHLY:', priceMonthly.id)

    // Price 3: Gezin (€9,99 Monthly - Was Annual Key, but user wants monthly billing)
    const priceFamily = await stripe.prices.create({
        product: productFamily.id,
        unit_amount: 999,
        currency: 'eur',
        recurring: { interval: 'month' }, // It's monthly billing!
        nickname: 'Gezin (Maandelijks)',
    })
    console.log('✅ Created PRICE_ANNUAL (Family):', priceFamily.id)

    // Output .env format
    console.log('\nCopy these to your .env.local (and Secrets Manager):')
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_WEEKEND=${priceWeekend.id}`)
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=${priceMonthly.id}`)
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=${priceFamily.id} # Note: This is now the Family Monthly Plan`)
}

main().catch(console.error)
