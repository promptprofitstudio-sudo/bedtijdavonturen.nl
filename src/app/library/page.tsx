'use client'

import Link from 'next/link'
import * as React from 'react'
import { Card, SectionTitle, Button } from '@/components/ui'
import { StoryCard } from '@/components/StoryCard'
import { useAuth } from '@/context/AuthContext'
import { getUserStories } from '@/lib/firebase/db'
import { Story } from '@/lib/types'

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth()
  const [stories, setStories] = React.useState<Story[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchStories() {
      if (!user) return
      try {
        const data = await getUserStories(user.uid)
        setStories(data)
      } catch (err) {
        console.error('Failed to load stories:', err)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      if (user) {
        fetchStories()
      } else {
        setLoading(false)
      }
    }
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <main className="px-4 py-6 space-y-6">
        <header className="flex items-start justify-between gap-4">
          <SectionTitle title="Bibliotheek" subtitle="Laden..." />
        </header>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-ink-100/50 rounded-2xl animate-pulse" />)}
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="px-4 py-6 space-y-6 text-center">
        <SectionTitle title="Bibliotheek" subtitle="Log in om je verhalen te zien." />
        <Link href="/account"><Button>Inloggen</Button></Link>
      </main>
    )
  }

  return (
    <main className="px-4 py-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <SectionTitle title="Bibliotheek" subtitle="Jouw verhalen en series." />
        <Link href="/wizard" className="text-sm font-semibold text-ink-950 underline">Nieuw</Link>
      </header>

      {stories.length === 0 ? (
        <Card className="text-center py-8 space-y-4">
          <p className="text-lg font-bold text-ink-800">Nog geen verhalen</p>
          <p className="text-sm text-ink-600">Maak je eerste bedtijdavontuur in 60 seconden.</p>
          <Link href="/wizard"><Button variant="primary">Maak Verhaal</Button></Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      )}
    </main>
  )
}
