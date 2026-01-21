import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import { getAdminDb, getSecret } from '@/lib/firebase/admin'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get('Stripe-Signature') as string

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || await getSecret('STRIPE_WEBHOOK_SECRET')

    if (!webhookSecret) {
        console.error('Missing STRIPE_WEBHOOK_SECRET (checked env and GSM)')
        return new NextResponse('Webhook Config Error', { status: 500 })
    }

    let event: Stripe.Event

    try {
        const stripe = await getStripe()
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
        console.error(`Webhook signature verification failed.`, err.message)
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
    }

    const session = event.data.object as Stripe.Checkout.Session

    if (event.type === 'checkout.session.completed') {
        const userId = session.metadata?.userId
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        if (userId) {
            try {
                const db = await getAdminDb()
                await db.collection('users').doc(userId).update({
                    subscriptionStatus: 'premium', // Or verify product/price if needed
                    subscriptionId: subscriptionId || session.id, // Subscription ID or Session ID (for one-time)
                    stripeCustomerId: customerId,
                    updatedAt: new Date()
                })
                console.log(`[Stripe] User ${userId} upgraded to Premium via ${event.type}`)
            } catch (dbErr) {
                console.error('[Stripe] DB Update Failed:', dbErr)
                return new NextResponse('Database Error', { status: 500 })
            }
        }
    }

    if (event.type === 'invoice.payment_succeeded') {
        // Handle recurring payment success
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string
        // We might not have userId in invoice metadata directly unless we added subs metadata
        // Usually we look up by customerId/subscriptionId
        // implementation simplification: We assume checkout session handled the initial upgrade.
        // For recurring, we should ensure status stays active.
        console.log(`[Stripe] Invoice paid for customer ${customerId}`)
    }

    if (event.type === 'customer.subscription.deleted') {
        // Downgrade user
        const subscriptionId = (event.data.object as Stripe.Subscription).id
        // Need to find user by subscriptionId
        const db = await getAdminDb()
        const usersRef = db.collection('users')
        const snapshot = await usersRef.where('subscriptionId', '==', subscriptionId).get()

        if (!snapshot.empty) {
            const batch = db.batch()
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, { subscriptionStatus: 'free' })
            })
            await batch.commit()
            console.log(`[Stripe] Subscription ${subscriptionId} canceled. Downgraded users.`)
        }
    }

    return NextResponse.json({ received: true })
}
