import { Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils'

export type Plan = {
  name: string
  price: string
  tagline: string
  features: string[]
  variant?: 'default' | 'family' | 'weekend'
  priceId?: string
  period?: string
  buttonText?: string
  highlighted?: boolean
  badge?: {
    text: string
    color: 'orange' | 'green' | 'blue'
  }
}

export function PlanCard({ plan, onSelect, isLoading }: { plan: Plan; onSelect?: () => void; isLoading?: boolean }) {
  // Use variant OR highlighted flag for styling
  const isHighlighted = plan.highlighted || plan.variant === 'family'
  const isWeekend = plan.variant === 'weekend'

  return (
    <Card
      className={cn(
        'space-y-4 transition-all duration-300 relative overflow-hidden',
        isHighlighted && 'border-lavender-400 ring-1 ring-lavender-200 shadow-md scale-[1.02]',
        isWeekend && 'border-teal-200 bg-teal-50'
      )}
    >
      {/* AU-004: Plan Badges */}
      {plan.badge && (
        <div className={cn(
          "absolute top-0 right-0 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider",
          plan.badge.color === 'orange' && "bg-orange-100 text-orange-700",
          plan.badge.color === 'green' && "bg-green-100 text-green-700",
          plan.badge.color === 'blue' && "bg-blue-100 text-blue-700"
        )}>
          {plan.badge.text}
        </div>
      )}

      {isHighlighted && !plan.badge && (
        <div className="absolute top-0 right-0 bg-lavender-100 text-lavender-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
          Meest Gekozen
        </div>
      )}

      {isWeekend && !plan.badge && (
        <div className="absolute top-0 right-0 bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
          Flexibel
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
          {plan.period && (
            <span className={cn(
              "text-sm font-bold",
              plan.period === 'eenmalig' ? "text-mint-600" : "text-ink-400"
            )}>
              {plan.period}
            </span>
          )}
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
        variant={isWeekend ? 'teal' : (isHighlighted ? 'primary' : 'secondary')}
        className="w-full text-lg h-14"
        onClick={onSelect}
        disabled={isLoading}
      >
        {isLoading ? 'Even geduld...' : (plan.buttonText || `Kies ${plan.name}`)}
      </Button>
    </Card>
  )
}
