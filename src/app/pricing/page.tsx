'use client'

import * as React from 'react'
import { SectionTitle, Card } from '@/components/ui'
import { PlanCard, type Plan } from '@/components/PlanCard'
import { PricingFAQ } from '@/components/PricingFAQ'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { createCheckoutSession } from '@/app/actions/stripe'
import { STRIPE_CONFIG } from '@/lib/stripe-config'
import { usePostHog } from 'posthog-js/react'

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const posthog = usePostHog()
  const [isPending, startTransition] = React.useTransition()
  const [toast, setToast] = React.useState<string | null>(null)

  // Track pricing page load
  React.useEffect(() => {
    posthog?.capture('pricing_page_loaded', {
      referrer: document.referrer || 'direct',
      device_type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
    })
  }, [posthog])

  /* Refined Packages (v2.2) with AU-004 badges */
  const plans: Plan[] = [
    {
      name: 'Weekend Pakket',
      price: '€2,99',
      period: 'eenmalig',
      tagline: '3 bedtime stories — enough to get through sleepover drama',
      features: ['3 Verhalen die niet verlopen', 'Perfect voor logeerpartijtjes of oppas', 'Inclusief Audio & Print', 'Geen maandelijkse kosten'],
      variant: 'weekend',
      highlighted: false,
      buttonText: 'Start Now — 3 Stories for €2.99',
      priceId: STRIPE_CONFIG.prices.weekend,
    },
    {
      name: 'Rust & Regelmaat',
      price: '€7,99',
      period: '/ maand',
      tagline: 'A new story every night — never use the same bedtime script twice',
      features: ['Onbeperkt Audio 🎧', 'Voor 1 kind', 'Alle lees- en luisterfuncties', 'Cancel anytime. No questions. No auto-renewal surprises.'],
      variant: 'default',
      highlighted: true,
      buttonText: 'Try Free for 7 Days',
      priceId: STRIPE_CONFIG.prices.monthly,
      badge: { text: 'Aanbevolen', color: 'orange' }, // AU-004
    },
    {
      name: 'Family',
      price: '€9,99',
      period: '/ maand',
      tagline: 'Bedtime peace for your whole house — even Grandma\'s got a story ready',
      features: ['Onbeperkt Audio 🎧', '5 Kindprofielen', 'Premium Stemmen', 'Grandparents can listen & read along from their own home — bonding made easy'],
      variant: 'default',
      highlighted: false,
      buttonText: 'Unlock Family Plan',
      priceId: STRIPE_CONFIG.prices.annual,
      badge: { text: 'Beste Waarde', color: 'green' }, // AU-004
    },
  ]

  /* New State for Waiver Checkbox */
  const [agreedToTerms, setAgreedToTerms] = React.useState(false)

  const handleSelect = (plan: Plan) => {
    if (!user) {
      setToast('Log eerst in om te abonneren.')
      setTimeout(() => router.push('/account'), 1500)
      return
    }

    // AU-004: Fire analytics events
    posthog?.capture('plan_selected', {
      plan_name: plan.name,
      plan_price_eur: parseFloat(plan.price.replace('€', '')),
      device_type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
      from_faq_context: false,
    })

    posthog?.capture('payment_initiated', {
      plan_name: plan.name,
      plan_price_eur: parseFloat(plan.price.replace('€', '')),
      payment_method: 'card', // Default
      device_type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
      total_amount_eur: parseFloat(plan.price.replace('€', '')),
    })

    /* Checkbox Validation */
    if (!agreedToTerms) {
      setToast('Ga eerst akkoord met de voorwaarden.')
      return
    }

    if (!plan.priceId) {
      setToast('Deze bundel is nog niet beschikbaar.')
      return
    }

    setToast('Bezig met doorsturen naar Stripe...')

    startTransition(async () => {
      try {
        await createCheckoutSession(plan.priceId!, user.uid)
      } catch (err: any) {
        console.error(err)
        setToast('Er ging iets mis: ' + err.message)
      }
    })
  }

  return (
    <main className="px-4 py-6 space-y-6">
      <header className="space-y-2">
        <SectionTitle title="Kies je plan" subtitle="Stop fighting bedtime. Start enjoying it." />
      </header>

      {/* [NEW] Trial Status Banner */}
      {user?.subscriptionStatus === 'trial' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-2">
          <p className="text-green-800 font-bold">✨ Je geniet van 7 dagen gratis Premium!</p>
          <p className="text-xs text-green-700">
            Dankzij onze partner{user.referredBy ? ` (${user.referredBy})` : ''} luister je gratis.<br />
            Na de proefperiode val je automatisch terug naar gratis (geen kosten).
          </p>
        </div>
      )}

      <div className="space-y-3">
        {/* Compliance Checkbox */}
        <div className="bg-moon-50 p-3 rounded-xl border border-moon-100 flex gap-3 items-start">
          <input
            type="checkbox"
            id="terms-waiver"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-ink-300 text-navy-600 focus:ring-navy-600"
          />
          <label htmlFor="terms-waiver" className="text-xs text-ink-700 cursor-pointer">
            Ik ga akkoord met de <a href="/terms" target="_blank" className="underline font-bold">voorwaarden</a> en verklaar dat ik afstand doe van mijn herroepingsrecht zodra de directe levering begint (direct na betaling).
          </label>
        </div>

        {plans.map((p) => (
          <PlanCard
            key={p.name}
            plan={p}
            onSelect={() => handleSelect(p)}
            isLoading={isPending}
          />
        ))}
      </div>

      <Card className="space-y-2">
        <p className="text-sm font-extrabold">Niet goed? Geld terug.</p>
        <p className="text-xs text-ink-800/70">Abonnementen zijn op elk moment met 1 klik te stoppen in je account.</p>
      </Card>

      {/* AU-004: Pricing FAQ Section */}
      <div className="mt-8">
        <PricingFAQ deviceType={window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'} />
      </div>

      {toast && (
        <div className="fixed left-0 right-0 bottom-20 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="mx-auto max-w-md px-4">
            <div className="rounded-2xl bg-ink-950 px-4 py-3 text-sm font-semibold text-moon-50 shadow-soft">
              {toast}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
