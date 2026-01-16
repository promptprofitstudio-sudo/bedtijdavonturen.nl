import { cn } from '@/lib/utils'

export function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Stap ${step} van ${total}`}>
      {Array.from({ length: total }).map((_, idx) => {
        const active = idx + 1 === step
        const done = idx + 1 < step
        return (
          <span
            key={idx}
            className={cn(
              'h-2 w-2 rounded-full transition',
              active ? 'bg-ink-950' : done ? 'bg-moon-200' : 'bg-moon-100'
            )}
          />
        )
      })}
    </div>
  )
}
