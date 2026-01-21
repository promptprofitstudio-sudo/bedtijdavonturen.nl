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

        <Card className="space-y-4 text-center py-8">
          <p className="text-sm text-ink-800">Maak een account om profielen voor je kinderen aan te maken en verhalen op te slaan.</p>
          <Button onClick={signInWithGoogle} className="w-full shadow-soft">
            Inloggen met Google
          </Button>
          <EmailLoginForm />
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

      <div className="text-center">
        <p className="text-xs text-ink-400">User ID: {user.uid}</p>
      </div>
    </main>
  )
}
