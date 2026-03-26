const DEFAULT_STRIPE_PRICE_IDS = {
    weekend: 'price_1SvNvBJwBpgxJArJWbCTxQ1V',
    monthly: 'price_1SvNvBJwBpgxJArJaa6upgiP',
    family: 'price_1SvNvCJwBpgxJArJOjRVAXNt',
} as const

export const STRIPE_CONFIG = {
    prices: {
        weekend: process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKEND || process.env.STRIPE_PRICE_WEEKEND || DEFAULT_STRIPE_PRICE_IDS.weekend, // One-time
        monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || process.env.STRIPE_PRICE_MONTHLY || DEFAULT_STRIPE_PRICE_IDS.monthly, // Subscription
        // Current plan naming is "Family" (monthly). Keep `annual` alias for backwards compatibility.
        family: process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY || process.env.STRIPE_PRICE_FAMILY || process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL || process.env.STRIPE_PRICE_ANNUAL || DEFAULT_STRIPE_PRICE_IDS.family,
        annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL || process.env.STRIPE_PRICE_ANNUAL || process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY || process.env.STRIPE_PRICE_FAMILY || DEFAULT_STRIPE_PRICE_IDS.family,
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
