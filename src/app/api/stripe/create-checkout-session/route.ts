import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { resolvePlanFromPriceId } from '@/lib/stripe-config'

function normalizeOrigin(value: string) {
  const trimmed = value.trim().replace(/\/$/, '')
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return `https://${trimmed}`
}

async function resolveOrigin() {
  if (process.env.FIREBASE_APP_HOSTING_URL) {
    return normalizeOrigin(process.env.FIREBASE_APP_HOSTING_URL)
  }

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return normalizeOrigin(process.env.NEXT_PUBLIC_BASE_URL)
  }

  if (process.env.VERCEL_URL) {
    return normalizeOrigin(process.env.VERCEL_URL)
  }

  const h = await headers()
  const headerOrigin = h.get('origin')
  if (headerOrigin) {
    return normalizeOrigin(headerOrigin)
  }

  const host = h.get('x-forwarded-host') || h.get('host')
  if (host) {
    const proto = h.get('x-forwarded-proto') || 'https'
    return normalizeOrigin(`${proto}://${host}`)
  }

  return 'http://localhost:3000'
}

export async function POST(req: Request) {
  try {
    const { priceId, userId } = await req.json()

    if (!priceId || !userId) {
      return NextResponse.json({ error: 'Missing checkout parameters' }, { status: 400 })
    }

    const origin = await resolveOrigin()

    console.log('[Stripe API] Creating checkout session:', {
      origin,
      success_url: `${origin}/account?success=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
      priceId,
    })

    const stripe = await getStripe()
    const stripePrice = await stripe.prices.retrieve(priceId)

    if (!stripePrice || 'deleted' in stripePrice) {
      return NextResponse.json({ error: `Unknown Stripe price: ${priceId}` }, { status: 400 })
    }

    if (!stripePrice.active) {
      return NextResponse.json({ error: `Inactive Stripe price: ${priceId}` }, { status: 400 })
    }

    const mode: 'payment' | 'subscription' = stripePrice.type === 'one_time' ? 'payment' : 'subscription'

    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: mode === 'payment' ? ['card', 'ideal'] : ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        priceId,
      },
      client_reference_id: userId,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      ...(mode === 'subscription' ? { subscription_data: { metadata: { userId, priceId } } } : {}),
      success_url: `${origin}/account?success=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
    })

    try {
      const { trackServerEventAsync } = await import('@/lib/analytics-async')
      trackServerEventAsync({
        userId,
        event: 'checkout_started',
        properties: { price_id: priceId, mode, plan: resolvePlanFromPriceId(priceId) },
      })
    } catch (analyticsErr) {
      console.error('[Stripe API] Analytics queueing failed:', analyticsErr)
    }

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 502 })
    }

    return NextResponse.json({ ok: true, url: session.url })
  } catch (err: any) {
    console.error('Stripe Checkout API Error:', err)
    return NextResponse.json({ error: 'Checkout failed: ' + err.message }, { status: 500 })
  }
}
