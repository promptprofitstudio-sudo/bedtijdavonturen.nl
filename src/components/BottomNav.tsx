'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const items = [
  { href: '/', label: 'Vanavond', icon: '🌙' },
  { href: '/library', label: 'Bibliotheek', icon: '📚' },
  { href: '/wizard', label: 'Maak', icon: '✨' },
  { href: '/pricing', label: 'Plan', icon: '💳' },
  { href: '/account', label: 'Account', icon: '👤' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-moon-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto max-w-md">
        <ul className="grid grid-cols-5">
          {items.map((it) => {
            const active = pathname === it.href
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={cn(
                    'flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold',
                    active ? 'text-ink-950' : 'text-ink-800/70'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className={cn('text-lg', active && 'animate-floaty')}>{it.icon}</span>
                  <span>{it.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
