
import { getSecret } from '../src/lib/secrets'
import Stripe from 'stripe'

async function main() {
    console.log("🚀 Syncing Stripe Products...")

    const key = await getSecret('STRIPE_SECRET_KEY')
    if (!key) {
        console.error("❌ STRIPE_SECRET_KEY not found.")
        process.exit(1)
    }

    const stripe = new Stripe(key, { apiVersion: '2025-01-27.acacia' as any })

    const plans = [
        {
            name: "Weekend Bundel",
            sku: "weekend_bundle",
            price: 299, // 2.99
            currency: 'eur',
            type: 'one_time',
            features: ['3 Credits', 'Voice Cloning']
        },
        {
            name: "Premium Maandelijks",
            sku: "premium_monthly",
            price: 999, // 9.99
            currency: 'eur',
            type: 'recurring',
            interval: 'month',
            features: ['Unlimited', 'Voice Cloning']
        },
        {
            name: "Premium Jaarlijks",
            sku: "premium_annual",
            price: 9900, // 99.00
            currency: 'eur',
            type: 'recurring',
            interval: 'year',
            features: ['Unlimited', 'Voice Cloning', '2 Months Free']
        }
    ]

    const priceMap: Record<string, string> = {}

    for (const plan of plans) {
        console.log(`\nChecking: ${plan.name}...`)

        // 1. Search Product
        const search = await stripe.products.search({
            query: `name:'${plan.name}' AND active:'true'`
        })

        let product
        if (search.data.length > 0) {
            product = search.data[0]
            console.log(`✅ Found Product: ${product.id}`)
        } else {
            console.log(`Creating Product: ${plan.name}...`)
            product = await stripe.products.create({
                name: plan.name,
                metadata: { sku: plan.sku }
            })
            console.log(`✨ Created Product: ${product.id}`)
        }

        // 2. Search Price
        const prices = await stripe.prices.list({
            product: product.id,
            active: true,
            limit: 10
        })

        // Filter for exact match
        let price = prices.data.find(p =>
            p.unit_amount === plan.price &&
            p.currency === plan.currency &&
            (plan.type === 'recurring' ? p.recurring?.interval === plan.interval : p.type === 'one_time')
        )

        if (price) {
            console.log(`✅ Found Price: ${price.id}`)
        } else {
            console.log(`Creating Price...`)
            price = await stripe.prices.create({
                product: product.id,
                currency: plan.currency,
                unit_amount: plan.price,
                recurring: plan.type === 'recurring' ? { interval: plan.interval as any } : undefined
            })
            console.log(`✨ Created Price: ${price.id}`)
        }

        priceMap[plan.sku] = price.id
    }

    console.log("\n✅ SYNC COMPLETE. Add these to .env.local:")
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_WEEKEND=${priceMap['weekend_bundle']}`)
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=${priceMap['premium_monthly']}`)
    console.log(`NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=${priceMap['premium_annual']}`)
}

main()
