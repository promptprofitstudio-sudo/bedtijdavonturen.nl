'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()

  const items = [
    { href: '/', label: 'Home', icon: 'home' },
    { href: '/wizard', label: "Thema's", icon: 'explore' },
    { href: '/library', label: 'Mijn Boeken', icon: 'library_books' },
    { href: '/account', label: 'Instellingen', icon: 'settings' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-background-dark/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 px-6 pb-8 pt-3 flex justify-between items-center z-[100] max-w-md mx-auto">
      {items.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              active ? "text-primary" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            )}
          >
            <span className={cn("material-symbols-outlined", active ? "!font-bold" : "")}>{item.icon}</span>
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
