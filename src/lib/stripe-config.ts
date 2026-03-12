export const STRIPE_CONFIG = {
    prices: {
        weekend: process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKEND || process.env.STRIPE_PRICE_WEEKEND || '', // One-time
        monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || process.env.STRIPE_PRICE_MONTHLY || '', // Subscription
        // Current plan naming is "Family" (monthly). Keep `annual` alias for backwards compatibility.
        family: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY || process.env.STRIPE_PRICE_FAMILY || process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL || process.env.STRIPE_PRICE_ANNUAL || '',
        annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL || process.env.STRIPE_PRICE_ANNUAL || process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY || process.env.STRIPE_PRICE_FAMILY || '',
    }
}

export function getCheckoutMode(priceId: string): 'payment' | 'subscription' {
    if (priceId === STRIPE_CONFIG.prices.weekend) {
        return 'payment'
    }
    return 'subscription'
}

export type StripePlanKey = 'weekend' | 'monthly' | 'family' | 'unknown'

export function resolvePlanFromPriceId(priceId: string): StripePlanKey {
    if (!priceId) return 'unknown'
    if (priceId === STRIPE_CONFIG.prices.weekend) return 'weekend'
    if (priceId === STRIPE_CONFIG.prices.monthly) return 'monthly'
    if (priceId === STRIPE_CONFIG.prices.family || priceId === STRIPE_CONFIG.prices.annual) return 'family'
    return 'unknown'
}
