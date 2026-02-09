'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button, Card, SectionTitle, Pill } from '@/components/ui'
import { EmailLoginForm } from '@/components/EmailLoginForm'
import { GoogleSignInButton } from '@/components/GoogleSignInButton'
import { useAuth } from '@/context/AuthContext'
import { InstallPwaButton } from '@/components/InstallPwaButton'
import { RedeemCouponForm } from '@/components/RedeemCouponForm'
// AddProfileForm removed
import { getProfiles, deleteProfile } from '@/lib/firebase/db'
import { ChildProfile } from '@/lib/types'

export default function AccountPage() {
  const { user, loading, signInWithGoogle, signOut, db, initError, retryInit } = useAuth()
  const [profiles, setProfiles] = useState<ChildProfile[]>([])
  const searchParams = useSearchParams()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  /* handleDelete removed, moved to /profiles */

  // Check for payment success
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccessMessage(true)
      // Auto-hide after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000)
      // Clean URL
      window.history.replaceState({}, '', '/account')
    }
  }, [searchParams])

  if (loading) {
    return (
      <main className="px-4 py-6 space-y-6">
        <p className="text-center text-sm text-ink-500">Laden...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="px-4 py-6 space-y-6">
        <header className="space-y-2">
          <SectionTitle title="Account" subtitle="Log in om verhalen te bewaren." />
        </header>

        {/* ERROR STATE FOR DEBUGGING MOBILE */}
        {initError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center space-y-3">
            <p className="text-red-600 font-bold">⚠️ Initialisatie Fout</p>
            <p className="text-xs text-red-500 font-mono break-all">{initError}</p>
            <Button variant="secondary" size="md" onClick={() => retryInit && retryInit()}>
              Probeer Opnieuw
            </Button>
          </div>
        )}

        <Card className="space-y-6 text-center py-10">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-navy-900">Welkom Ouders</h3>
            <p className="text-sm text-navy-500 max-w-xs mx-auto">Log in om magische verhalen te maken en te bewaren voor je kind.</p>
          </div>

          <GoogleSignInButton
            className="w-full h-12 text-base"
            variant="light"
            disabled={!!initError}
            onClick={async () => {
              if (initError) {
                alert("Kan niet inloggen door initialisatiefout: " + initError);
                return;
              }
              try {
                await signInWithGoogle()
              } catch (err: any) {
                alert('Google Login Fout: ' + err.message)
              }
            }}
          />

          <div className="pt-2">
            <details className="group">
              <summary className="text-xs text-navy-400 hover:text-navy-600 cursor-pointer list-none select-none">
                <span className="border-b border-dashed border-navy-200">Of log in met e-mail</span>
              </summary>
              <div className="mt-4 animate-in slide-in-from-top-2 fade-in duration-300">
                <EmailLoginForm />
              </div>
            </details>
          </div>
        </Card>
      </main>
    )
  }

  return (
    <main className="px-4 py-6 space-y-6">
      {/* Payment Success Banner */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-2 animate-in slide-in-from-top-2 fade-in">
          <p className="text-green-800 font-bold text-lg">🎉 Betaling geslaagd!</p>
          <p className="text-sm text-green-700">
            Je hebt nu toegang tot je verhalen. Geniet ervan!
          </p>
        </div>
      )}

      <header className="space-y-2">
        <div className="flex justify-between items-start">
          <SectionTitle title="Hallo!" subtitle={user.displayName || 'Ouder'} />
          <Button variant="ghost" size="md" onClick={signOut}>Uitloggen</Button>
        </div>
      </header>

      <Card className="space-y-4">
        <div className="flex justify-between items-center">
          <SectionTitle title="Mijn Kinderen" subtitle="Beheer profielen." />
          <Link href="/profiles">
            <Button variant="secondary" size="md">Beheren</Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {profiles.slice(0, 2).map(p => (
            <div key={p.id} className="bg-moon-50 rounded-xl p-3 flex items-center gap-2 border border-moon-100">
              <span className="text-xl">{p.avatar || '👤'}</span>
              <span className="font-bold text-sm text-navy-900 truncate">{p.name}</span>
            </div>
          ))}
          {profiles.length > 2 && (
            <div className="bg-moon-50 rounded-xl p-3 flex items-center justify-center text-xs font-medium text-navy-500">
              +{profiles.length - 2} meer
            </div>
          )}
        </div>
      </Card>

      {/* Coupon Redemption */}
      <RedeemCouponForm />

      <Card className="space-y-2">
        <p className="text-sm font-extrabold">Abonnement</p>
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-800">Huidig plan:</p>
          <Pill>{user.subscriptionStatus === 'premium' ? 'Premium 🌟' : 'Gratis'}</Pill>
        </div>
        {user.subscriptionStatus !== 'premium' && (
          <Link href="/pricing" className="block mt-2">
            <Button variant="primary" className="w-full">Upgrade naar Premium</Button>
          </Link>
        )}
      </Card>

      <Card className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <SectionTitle title="Jouw Stem" subtitle="Laat de AI voorlezen met jouw stem." />
            {user.customVoiceId ? (
              <Pill>Actief ✅</Pill>
            ) : (
              <p className="text-xs text-navy-500">Nog niet ingesteld</p>
            )}
          </div>
          <Link href="/account/voice">
            <Button variant="teal" size="md">Instellen</Button>
          </Link>
        </div>
      </Card>

      <div className="text-center space-y-4">
        <InstallPwaButton />

        <p className="text-xs text-ink-400">User ID: {user.uid}</p>
        <div className="border-t border-moon-100 pt-4">
          <Button
            variant="ghost"
            size="md"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={async () => {
              const confirm = window.confirm('Weet u zeker dat u uw account wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')
              if (confirm) {
                try {
                  const { deleteUserData } = await import('@/lib/firebase/db')

                  // Dynamic import to get Auth instance
                  const { getAuth, deleteUser } = await import('firebase/auth')
                  const auth = getAuth()
                  const currentUser = auth.currentUser

                  if (!currentUser) throw new Error('Geen gebruiker ingelogd')

                  await deleteUserData(currentUser.uid)
                  await deleteUser(currentUser)

                  // Redirect handled by AuthContext or refresh
                  window.location.href = '/'
                } catch (err: any) {
                  console.error(err)
                  alert('Kon account niet verwijderen. Log opnieuw in en probeer het nogmaals. (Error: ' + err.message + ')')
                }
              }
            }}
          >
            Account Verwijderen
          </Button>
        </div>
      </div>
    </main>
  )
}
