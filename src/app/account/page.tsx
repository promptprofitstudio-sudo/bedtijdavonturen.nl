'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button, Card, SectionTitle, Pill } from '@/components/ui'
import { EmailLoginForm } from '@/components/EmailLoginForm'
import { useAuth } from '@/context/AuthContext'
// AddProfileForm removed
import { getProfiles, deleteProfile } from '@/lib/firebase/db'
import { ChildProfile } from '@/lib/types'

export default function AccountPage() {
  const { user, loading, signInWithGoogle, signOut, db } = useAuth()
  const [profiles, setProfiles] = useState<ChildProfile[]>([])
  /* handleDelete removed, moved to /profiles */

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

        <Card className="space-y-6 text-center py-10">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-navy-900">Welkom Ouders</h3>
            <p className="text-sm text-navy-500 max-w-xs mx-auto">Log in om magische verhalen te maken en te bewaren voor je kind.</p>
          </div>

          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await signInWithGoogle()
              } catch (err: any) {
                alert('Google Login Fout: ' + err.message)
              }
            }}
            className="w-full shadow-soft border border-moon-300 hover:bg-moon-50 relative flex items-center justify-center gap-3 h-12"
          >
            <svg className="w-5 h-5 absolute left-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            <span className="font-bold">Inloggen</span>
          </Button>

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

      <div className="text-center space-y-4">
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
