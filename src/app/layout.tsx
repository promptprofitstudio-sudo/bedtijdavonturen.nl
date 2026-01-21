import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/BottomNav'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Bedtijdavonturen',
  description: 'Magische verhalen voor het slapengaan',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Bedtijdavonturen',
  },
}

import { Footer } from '@/components/Footer'
import { CookieBanner } from '@/components/CookieBanner'
import { AuthProvider } from '@/context/AuthContext'
import { PostHogProvider } from '@/components/PostHogProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={inter.variable}>
      <body className="min-h-dvh bg-moon-50 text-ink-950">
        <PostHogProvider>
          <AuthProvider>
            <div className="mx-auto min-h-dvh max-w-md pb-24 relative">
              {children}
              <Footer />
              <CookieBanner />
            </div>
            <BottomNav />
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
