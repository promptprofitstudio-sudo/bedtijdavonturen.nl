'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { SectionTitle, Card } from '@/components/ui'
import { PlanCard, type Plan } from '@/components/PlanCard'
import { PricingFAQ } from '@/components/PricingFAQ'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { createCheckoutSession } from '@/app/actions/stripe'
import { STRIPE_CONFIG } from '@/lib/stripe-config'
import { usePostHog } from 'posthog-js/react'

export const dynamic = 'force-dynamic'

function PricingPageContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
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

  React.useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      setToast('Betaling geannuleerd. Je kunt een plan opnieuw kiezen.')
    }
  }, [searchParams])

  /* Refined Packages (v2.2) with AU-004 badges */
  const plans: Plan[] = [
    {
      name: 'Weekend Pakket',
      price: '€2,99',
      period: 'eenmalig',
      tagline: '3 verhalen voor het slapengaan — genoeg om logeerpartijtjes zonder drama door te komen',
      features: ['3 Verhalen die niet verlopen', 'Perfect voor logeerpartijtjes of oppas', 'Inclusief Audio & Print', 'Geen maandelijkse kosten'],
      variant: 'weekend',
      highlighted: false,
      buttonText: 'Start Nu — 3 Verhalen voor €2,99',
      priceId: STRIPE_CONFIG.prices.weekend,
    },
    {
      name: 'Rust & Regelmaat',
      price: '€7,99',
      period: '/ maand',
      tagline: 'Elke avond een nieuw verhaal — gebruik nooit meer twee keer hetzelfde script',
      features: ['Onbeperkt Audio 🎧', 'Voor 1 kind', 'Alle lees- en luisterfuncties', 'Opzeggen kan altijd. Geen vragen. Geen verrassingen.'],
      variant: 'default',
      highlighted: true,
      buttonText: 'Probeer 7 Dagen Gratis',
      priceId: STRIPE_CONFIG.prices.monthly,
      badge: { text: 'Aanbevolen', color: 'orange' },
    },
    {
      name: 'Familie',
      price: '€9,99',
      period: '/ maand',
      tagline: 'Avondrust voor het hele gezin — zelfs oma heeft een verhaal klaar',
      features: ['Onbeperkt Audio 🎧', '5 Kindprofielen', 'Premium Stemmen', 'Opa en oma kunnen meelezen en luisteren vanuit hun eigen huis'],
      variant: 'default',
      highlighted: false,
      buttonText: 'Kies het Familie Plan',
      priceId: STRIPE_CONFIG.prices.family,
      badge: { text: 'Beste Waarde', color: 'green' },
    },
  ]

  const [agreedToTerms, setAgreedToTerms] = React.useState(false)

  const getDeviceType = () => {
    if (typeof window === 'undefined') return 'desktop'
    return window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
  }

  const handleSelect = (plan: Plan) => {
    if (isPending) return

    if (!user) {
      setToast('Log eerst in om te abonneren.')
      router.push('/account?next=%2Fpricing')
      return
    }

    const deviceType = getDeviceType()

    if (!agreedToTerms) {
      setToast('Ga eerst akkoord met de voorwaarden.')
      return
    }

    const selectedPriceId = plan.priceId

    if (!selectedPriceId) {
      setToast('Deze bundel is nog niet beschikbaar.')
      return
    }

    if (!selectedPriceId.startsWith('price_')) {
      setToast('Deze bundel heeft een ongeldige Stripe prijs-ID.')
      return
    }

    posthog?.capture('plan_selected', {
      plan_name: plan.name,
      plan_price_eur: parseFloat(plan.price.replace('€', '').replace(',', '.')),
      device_type: deviceType,
      from_faq_context: false,
    })

    posthog?.capture('payment_initiated', {
      plan_name: plan.name,
      plan_price_eur: parseFloat(plan.price.replace('€', '').replace(',', '.')),
      payment_method: 'card',
      device_type: deviceType,
      total_amount_eur: parseFloat(plan.price.replace('€', '').replace(',', '.')),
    })

    setToast('Bezig met doorsturen naar Stripe...')

    startTransition(async () => {
      try {
        const result = await createCheckoutSession(selectedPriceId, user.uid)

        if (!result?.url) {
          throw new Error('Geen checkout-link ontvangen van Stripe.')
        }

        window.location.href = result.url
      } catch (err: any) {
        console.error(err)
        setToast('Er ging iets mis: ' + err.message)
      }
    })
  }

  return (
    <main className="px-4 py-6 space-y-6">
      <header className="space-y-2">
        <SectionTitle title="Kies je plan" subtitle="Stop de strijd rond bedtijd. Begin met genieten." />
      </header>

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

      <div className="mt-8">
        <PricingFAQ deviceType={getDeviceType()} />
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

export default function PricingPage() {
  return (
    <Suspense fallback={
      <main className="px-4 py-6 space-y-6">
        <p className="text-center text-sm text-ink-500">Laden...</p>
      </main>
    }>
      <PricingPageContent />
    </Suspense>
  )
}
