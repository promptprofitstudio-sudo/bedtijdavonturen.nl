'use server'

import { getStripe } from '@/lib/stripe'
import { redirect } from 'next/navigation'
import { getCheckoutMode } from '@/lib/stripe-config'

export async function createCheckoutSession(priceId: string, userId: string) {
    if (!priceId || !userId) {
        console.error('Missing priceId or userId')
        return
    }

    // Determine domain
    const origin = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const mode = getCheckoutMode(priceId)

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
