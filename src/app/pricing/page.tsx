'use client'

import * as React from 'react'
import { SectionTitle, Card } from '@/components/ui'
import { PlanCard, type Plan } from '@/components/PlanCard'

const plans: Plan[] = [
  {
    name: 'Weekend Bundel',
    price: '€1,99',
    tagline: '3 losse verhalen. Ideaal om te proberen.',
    features: ['Geen abonnement', '3 credits', 'Blijft altijd geldig'],
    variant: 'weekend'
  },
  {
    name: 'Basis',
    price: '€7,99',
    tagline: 'Voor 1 kind — elke avond een rustig verhaal.',
    features: ['Onbeperkt verhalen', 'Leesmodus (dim)', 'Print/PDF', 'Bibliotheek & series'],
    variant: 'default'
  },
  {
    name: 'Family',
    price: '€9,99',
    tagline: 'Voor meerdere kinderen — inclusief luistermodus.',
    features: ['Tot 5 kindprofielen', 'Luistermodus (coming soon)', 'Snellere presets', 'Prioriteit op nieuwe features'],
    variant: 'family'
  },
]

export default function PricingPage() {
  const [toast, setToast] = React.useState<string | null>(null)
  return (
    <main className="px-4 py-6 space-y-6">
      <header className="space-y-2">
        <SectionTitle title="Kies je plan" subtitle="Prijs in de €7–€10 range — klaar voor eerste tractie." />
      </header>

      <div className="space-y-3">
        {plans.map((p) => (
          <PlanCard
            key={p.name}
            plan={p}
            onSelect={() => {
              setToast(`Gekozen: ${p.name} (checkout hook komt later)`)
              setTimeout(() => setToast(null), 2500)
            }}
          />
        ))}
      </div>

      <Card className="space-y-2">
        <p className="text-sm font-extrabold">Risk reversal</p>
        <p className="text-xs text-ink-800/70">7 dagen rustig proberen. Beëindigen kan meteen — geen gedoe.</p>
      </Card>

      {toast ? (
        <div className="fixed left-0 right-0 bottom-20 z-50">
          <div className="mx-auto max-w-md px-4">
            <div className="rounded-2xl bg-ink-950 px-4 py-3 text-sm font-semibold text-moon-50 shadow-soft">
              {toast}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
