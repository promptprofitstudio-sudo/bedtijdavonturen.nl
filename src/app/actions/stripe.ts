'use server'

import { getStripe } from '@/lib/stripe'
import { redirect } from 'next/navigation'
import { getCheckoutMode } from '@/lib/stripe-config'

export async function createCheckoutSession(priceId: string, userId: string) {
    if (!priceId || !userId) {
        console.error('Missing priceId or userId')
        return
    }

    // Determine domain for success/cancel URLs
    let origin = 'http://localhost:3000'

    // Production: Firebase App Hosting
    if (process.env.FIREBASE_APP_HOSTING_URL) {
        origin = process.env.FIREBASE_APP_HOSTING_URL
    }
    // Fallback: Next.js on Vercel
    else if (process.env.VERCEL_URL) {
        origin = `https://${process.env.VERCEL_URL}`
    }
    // Manual override (set in Secret Manager or GitHub Secrets)
    else if (process.env.NEXT_PUBLIC_BASE_URL) {
        origin = process.env.NEXT_PUBLIC_BASE_URL
    }

    const mode = getCheckoutMode(priceId)

    console.log('[Stripe] Creating checkout session:', {
        origin,
        success_url: `${origin}/account?success=true`,
        cancel_url: `${origin}/pricing?canceled=true`,
        mode,
        priceId
    })

    try {
        const stripe = await getStripe()
        const session = await stripe.checkout.sessions.create({
            mode: mode,
            payment_method_types: ['card', 'ideal'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            metadata: {
                userId,
            },
            customer_email: undefined,
            success_url: `${origin}/account?success=true`,
            cancel_url: `${origin}/pricing?canceled=true`,
        })

        const { trackServerEvent } = await import('@/lib/server-analytics')
        await trackServerEvent({
            userId,
            event: 'checkout_started',
            properties: { price_id: priceId, mode }
        })

        if (session.url) {
            redirect(session.url)
        }
    } catch (err: any) {
        console.error('Stripe Checkout Error:', err)
        // Check if it's a redirect error (NEXT_REDIRECT)
        if (err.message === 'NEXT_REDIRECT') throw err;
        throw new Error('Checkout failed: ' + err.message)
    }
}
