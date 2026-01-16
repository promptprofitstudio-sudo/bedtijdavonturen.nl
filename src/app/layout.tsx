import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/BottomNav'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Bedtijdavonturen — Gepersonaliseerde slaapverhalen',
  description: 'Maak in 60 seconden een rustig, gepersonaliseerd bedtijdverhaal — lees, luister of print.',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
}

import { AuthProvider } from '@/context/AuthContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={inter.variable}>
      <body className="min-h-dvh bg-moon-50 text-ink-950">
        <AuthProvider>
          <div className="mx-auto min-h-dvh max-w-md pb-20">
            {children}
          </div>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  )
}
