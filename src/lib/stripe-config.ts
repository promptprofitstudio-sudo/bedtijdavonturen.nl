export const STRIPE_CONFIG = {
    prices: {
        weekend: process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKEND || '', // One-time
        monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || '', // Subscription
        annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL || '',   // Subscription
    }
}

export function getCheckoutMode(priceId: string): 'payment' | 'subscription' {
    if (priceId === STRIPE_CONFIG.prices.weekend) {
        return 'payment'
    }
    return 'subscription'
}
