'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button, Card, SectionTitle, Pill } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { getProfiles } from '@/lib/profiles'
import { ChildProfile } from '@/lib/types'

export default function AccountPage() {
  const { user, loading, signInWithGoogle, signOut, db } = useAuth()
  const [profiles, setProfiles] = useState<ChildProfile[]>([])

  useEffect(() => {
    async function fetchProfiles() {
      if (user && db) {
        try {
          const list = await getProfiles(db, user.uid)
          setProfiles(list)
        } catch (err) {
          console.error('Failed to fetch profiles', err)
        }
      }
    }
    fetchProfiles()
  }, [user, db])

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
          <Button onClick={signInWithGoogle} className="w-full">
            Inloggen met Google
          </Button>
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
          <p className="text-sm font-extrabold">Mijn Kinderen</p>
          <Link href="/wizard"><Button variant="secondary" size="md">+ Toevoegen</Button></Link>
        </div>

        {profiles.length === 0 ? (
          <p className="text-xs text-ink-500 italic">Nog geen profielen. Maak er eentje aan!</p>
        ) : (
          <div className="space-y-2">
            {profiles.map(profile => (
              <div key={profile.id} className="flex items-center justify-between p-2 rounded-lg bg-moon-50 border border-moon-100">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{profile.avatar || '👤'}</span>
                  <div>
                    <p className="text-sm font-bold text-ink-900">{profile.name}</p>
                    <p className="text-xs text-ink-600">Leeftijd: {profile.ageGroup}</p>
                  </div>
                </div>
                <Pill>{profile.themePreference}</Pill>
              </div>
            ))}
          </div>
        )}
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
