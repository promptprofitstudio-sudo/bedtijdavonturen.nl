import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import { getAdminDb } from '@/lib/firebase/admin'
import { getSecret } from '@/lib/secrets'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

function getPriceMapping(
  priceId: string | undefined,
  price: Stripe.Price | Stripe.DeletedPrice | null | undefined,
  config: { prices: Record<string, string> },
) {
  if (!priceId && !price) return { creditsToAdd: 0, statusUpdate: null as string | null }

  if (priceId === config.prices.weekend) {
    return { creditsToAdd: 3, statusUpdate: null as string | null }
  }

  if (priceId === config.prices.monthly || priceId === config.prices.family || priceId === config.prices.annual) {
    return { creditsToAdd: priceId === config.prices.monthly ? 10 : 20, statusUpdate: 'premium' }
  }

  if (price && !('deleted' in price)) {
    if (price.type === 'one_time') {
      return { creditsToAdd: 3, statusUpdate: null as string | null }
    }

    if (price.recurring) {
      // Fallback by amount when IDs are not configured consistently at runtime.
      if (price.unit_amount === 999) {
        return { creditsToAdd: 20, statusUpdate: 'premium' }
      }
      return { creditsToAdd: 10, statusUpdate: 'premium' }
    }
  }

  return { creditsToAdd: 0, statusUpdate: null as string | null }
}

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
    console.error('Webhook signature verification failed.', err.message)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId || session.client_reference_id || undefined

    if (userId) {
      try {
        const db = await getAdminDb()
        const { FieldValue } = await import('firebase-admin/firestore')
        const { STRIPE_CONFIG } = await import('@/lib/stripe-config')
        const stripe = await getStripe()

        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 })
        const firstPrice = lineItems.data[0]?.price
        const priceId = typeof firstPrice === 'string' ? firstPrice : firstPrice?.id
        const { creditsToAdd, statusUpdate } = getPriceMapping(priceId, firstPrice, STRIPE_CONFIG)

        const updateData: Record<string, unknown> = {
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
          credits: FieldValue.increment(creditsToAdd),
          updatedAt: new Date(),
        }

        if (typeof session.subscription === 'string' && session.subscription) {
          updateData.subscriptionId = session.subscription
        }

        if (statusUpdate) {
          updateData.subscriptionStatus = statusUpdate
        }

        await db.collection('users').doc(userId).set(updateData, { merge: true })

        console.log(`[Stripe] User ${userId} upgraded:`, {
          priceId,
          creditsAdded: creditsToAdd,
          newStatus: statusUpdate || 'free',
          sessionId: session.id,
        })

        try {
          const { trackServerEventAsync } = await import('@/lib/analytics-async')
          trackServerEventAsync({
            userId,
            event: 'payment_completed',
            properties: {
              priceId,
              amount: (session.amount_total || 0) / 100,
              currency: session.currency || 'eur',
              subscriptionStatus: statusUpdate || 'free',
              creditsAdded: creditsToAdd,
              sessionId: session.id,
              customerEmail: session.customer_details?.email || session.customer_email,
            }
          })
        } catch (analyticsErr) {
          console.error('[Stripe] Analytics queueing failed:', analyticsErr)
        }
      } catch (dbErr) {
        console.error('[Stripe] DB Update Failed:', dbErr)
        return new NextResponse('Database Error', { status: 500 })
      }
    } else {
      console.warn('[Stripe] checkout.session.completed missing userId metadata', { sessionId: session.id })
    }
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = typeof (invoice as any).subscription === 'string' ? (invoice as any).subscription : (invoice as any).subscription?.id
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
    console.log(`[Stripe] Invoice paid for customer ${customerId} (subscription ${subscriptionId || 'unknown'})`)
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscriptionId = (event.data.object as Stripe.Subscription).id
    const db = await getAdminDb()
    const usersRef = db.collection('users')
    const snapshot = await usersRef.where('subscriptionId', '==', subscriptionId).get()

    if (!snapshot.empty) {
      const batch = db.batch()
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { subscriptionStatus: 'free', updatedAt: new Date() })
      })
      await batch.commit()
      console.log(`[Stripe] Subscription ${subscriptionId} canceled. Downgraded users.`)
    }
  }

  return NextResponse.json({ received: true })
}
