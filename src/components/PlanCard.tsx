import { Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils'

export type Plan = {
  name: string
  price: string
  tagline: string
  features: string[]
  variant?: 'default' | 'family' | 'weekend'
  priceId?: string
  intervalLabel?: string
}

export function PlanCard({ plan, onSelect, isLoading }: { plan: Plan; onSelect?: () => void; isLoading?: boolean }) {
  const isFamily = plan.variant === 'family'
  const isWeekend = plan.variant === 'weekend'

  return (
    <Card
      className={cn(
        'space-y-4 transition-all duration-300 relative overflow-hidden',
        isFamily && 'border-lavender-400 ring-1 ring-lavender-200 shadow-md scale-[1.02]',
        isWeekend && 'border-teal-200 bg-teal-50'
      )}
    >
      {isFamily && (
        <div className="absolute top-0 right-0 bg-lavender-100 text-lavender-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
          Populair
        </div>
      )}

      {isWeekend && (
        <div className="absolute top-0 right-0 bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
          Nieuw
        </div>
      )}

      <div className="space-y-1">
        <p className={cn(
          "text-sm font-extrabold uppercase tracking-wide",
          isWeekend ? "text-teal-700" : "text-ink-800/70"
        )}>
          {plan.name}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold">{plan.price}</span>
          {plan.intervalLabel && <span className="text-sm text-ink-800/70">{plan.intervalLabel}</span>}
        </div>
        <p className="text-sm text-ink-800/80">{plan.tagline}</p>
      </div>

      <ul className="space-y-2 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2">
            <span aria-hidden className={isWeekend ? "text-teal-500" : "text-ink-300"}>✓</span>
            <span className="text-ink-900/90">{f}</span>
          </li>
        ))}
      </ul>

      <Button
        size="lg"
        variant={isWeekend ? 'teal' : (isFamily ? 'primary' : 'secondary')}
        className="w-full text-lg h-14"
        onClick={onSelect}
        disabled={isLoading}
      >
        {isLoading ? 'Even geduld...' : `Kies ${plan.name}`}
      </Button>
    </Card>
  )
}
