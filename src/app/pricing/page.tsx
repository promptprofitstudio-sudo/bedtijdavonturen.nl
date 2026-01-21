'use client'

import * as React from 'react'
import { SectionTitle, Card } from '@/components/ui'
import { PlanCard, type Plan } from '@/components/PlanCard'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { createCheckoutSession } from '@/app/actions/stripe'
import { STRIPE_CONFIG } from '@/lib/stripe-config'

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [toast, setToast] = React.useState<string | null>(null)

  const plans: Plan[] = [
    {
      name: 'Weekend Bundel',
      price: '€1,99',
      tagline: '3 losse verhalen. Ideaal om te proberen.',
      features: ['Geen abonnement', '3 credits', 'Blijft altijd geldig'],
      variant: 'weekend',
      priceId: STRIPE_CONFIG.prices.weekend
    },
    {
      name: 'Premium Maandelijks',
      price: '€9,99',
      tagline: 'Onbeperkt verhalen & audio.',
      features: ['Onbeperkt verhalen', 'Onbeperkt audio', 'Opzegbaar per maand'],
      variant: 'default',
      priceId: STRIPE_CONFIG.prices.monthly
    },
    {
      name: 'Premium Jaarlijks',
      price: '€99,00',
      tagline: '2 maanden gratis.',
      features: ['Alles van Premium', 'Beste deal', 'Vo优先 support'],
      variant: 'family',
      priceId: STRIPE_CONFIG.prices.annual
    },
  ]

  const handleSelect = (plan: Plan) => {
    if (!user) {
      setToast('Log eerst in om te abonneren.')
      setTimeout(() => router.push('/account'), 1500)
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
        <SectionTitle title="Kies je plan" subtitle="Investeer in magische momenten." />
      </header>

      <div className="space-y-3">
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
        <p className="text-sm font-extrabold">Niet tevreden? Geld terug</p>
        <p className="text-xs text-ink-800/70">Probeer het 7 dagen. Beëindigen kan meteen.</p>
      </Card>

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

