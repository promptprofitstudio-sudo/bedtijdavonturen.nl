import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import { getAdminDb } from '@/lib/firebase/admin'
import { getSecret } from '@/lib/secrets'
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
                const { FieldValue } = await import('firebase-admin/firestore')

                // Determine credits and subscription status
                let creditsToAdd = 0
                let statusUpdate: string | null = null

                const { STRIPE_CONFIG } = await import('@/lib/stripe-config')

                const stripe = await getStripe()
                const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
                const priceId = lineItems.data[0]?.price?.id

                if (priceId === STRIPE_CONFIG.prices.weekend) {
                    // Weekend Rust: 3 Credits (one-time purchase, no subscription)
                    creditsToAdd = 3
                    // No status change - user remains 'free' but with credits
                } else if (priceId === STRIPE_CONFIG.prices.monthly) {
                    // Rust & Regelmaat: Basic Subscription (Unlimited for 1 child)
                    creditsToAdd = 10 // Safety buffer
                    statusUpdate = 'premium' // Grant premium access
                } else if (priceId === STRIPE_CONFIG.prices.annual) {
                    // Gezin: Family Subscription (Unlimited + 5 profiles)
                    creditsToAdd = 20 // Safety buffer
                    statusUpdate = 'premium' // Grant premium access
                }

                const updateData: any = {
                    subscriptionId: subscriptionId || session.id,
                    stripeCustomerId: customerId,
                    credits: FieldValue.increment(creditsToAdd),
                    updatedAt: new Date()
                }

                // Update subscription status if this is a subscription purchase
                if (statusUpdate) {
                    updateData.subscriptionStatus = statusUpdate
                }

                await db.collection('users').doc(userId).update(updateData)

                console.log(`[Stripe] User ${userId} upgraded:`, {
                    priceId,
                    creditsAdded: creditsToAdd,
                    newStatus: statusUpdate || 'free',
                    sessionId: session.id
                })

                // Track payment success in analytics
                try {
                    const { trackServerEvent } = await import('@/lib/server-analytics')
                    await trackServerEvent({
                        userId,
                        event: 'payment_completed',
                        properties: {
                            priceId,
                            amount: (session.amount_total || 0) / 100,
                            currency: session.currency || 'eur',
                            subscriptionStatus: statusUpdate || 'free',
                            creditsAdded: creditsToAdd,
                            sessionId: session.id,
                            customerEmail: session.customer_email
                        }
                    })
                } catch (analyticsErr) {
                    // Don't fail payment processing if analytics fails
                    console.error('[Stripe] Analytics tracking failed:', analyticsErr)
                }
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
