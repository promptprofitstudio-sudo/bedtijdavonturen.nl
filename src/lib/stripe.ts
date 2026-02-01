import Stripe from 'stripe'
import { getSecret } from '@/lib/secrets'

let stripeInstance: Stripe | null = null

export async function getStripe() {
    if (stripeInstance) return stripeInstance

    // Try env first (for dev/build), then GSM
    const key = process.env.STRIPE_SECRET_KEY || await getSecret('STRIPE_SECRET_KEY')

    if (!key) {
        throw new Error('STRIPE_SECRET_KEY is missing (checked env and GSM).')
    }

    stripeInstance = new Stripe(key, {
        apiVersion: '2025-12-15.clover' as any,
        typescript: true,
    })

    return stripeInstance
}
