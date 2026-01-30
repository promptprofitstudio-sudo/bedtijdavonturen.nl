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

import { CookieBanner } from '@/components/CookieBanner'
import { AuthProvider } from '@/context/AuthContext'
import { PostHogProvider } from '@/components/PostHogProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={inter.variable}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <style>{`
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          }
        `}</style>
      </head>
      <body className="min-h-dvh bg-moon-50 text-ink-950">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              'name': 'Bedtijdavonturen',
              'applicationCategory': 'EducationApplication',
              'offers': {
                '@type': 'Offer',
                'price': '1.99',
                'priceCurrency': 'EUR'
              }
            })
          }}
        />
        <PostHogProvider>
          <AuthProvider>
            <div className="mx-auto min-h-dvh max-w-md pb-24 relative">
              {children}
              <CookieBanner />
            </div>
            <BottomNav />
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
