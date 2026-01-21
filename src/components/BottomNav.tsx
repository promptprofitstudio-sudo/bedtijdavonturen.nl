'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const items = [
  { href: '/', label: 'Vandaag', icon: '☀️' }, // Changed to sun/day icon or just dot? Mockup uses dots/simple icons.
  { href: '/library', label: 'Bibliotheek', icon: '📚' },
  { href: '/profiles', label: 'Profielen', icon: '👤' }, // New Profiles page
  { href: '/account', label: 'Account', icon: '⚙️' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-moon-200 bg-white/95 backdrop-blur-lg pb-safe">
      <div className="mx-auto max-w-md">
        <ul className="grid grid-cols-4 h-[88px] pb-4"> {/* Taller nav area as per mockup spacing */}
          {items.map((it) => {
            const active = pathname === it.href
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={cn(
                    'flex h-full w-full flex-col items-center justify-center gap-1.5 transition-colors',
                    active ? 'text-teal-500' : 'text-navy-800/40 hover:text-navy-800/60'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <div className={cn(
                    "text-2xl transition-transform duration-200",
                    active && "scale-110"
                  )}>
                    {active ? '●' : '○'} {/* Mockup seems to use simple indicators or outline/filled icons. Using circles for now as clean default if no specific SVG provided. Or keep emojis but styled. */}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide">{it.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
