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
      <main className="px-5 py-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Bibliotheek</h1>
          <p className="text-navy-800/60 font-medium">Laden van jouw collectie...</p>
        </header>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-navy-50 rounded-3xl animate-pulse" />)}
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="px-5 py-8 space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-navy-900">Bibliotheek</h1>
          <p className="text-navy-800/60">Log in om je verhalen te bewaren en terug te lezen.</p>
        </div>
        <Link href="/account"><Button variant="primary" size="lg" className="w-full shadow-soft">Nu Inloggen</Button></Link>
      </main>
    )
  }

  return (
    <main className="px-5 py-8 space-y-8 pb-32">
      <header className="flex items-end justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Jouw verhalen</h1>
          <p className="text-navy-800/60 font-medium">Tik en ga door waar je gebleven was.</p>
        </div>
        <Link href="/wizard">
          <Button variant="teal" className="rounded-full w-10 h-10 p-0 shadow-soft text-lg flex items-center justify-center">
            +
          </Button>
        </Link>
      </header>

      {stories.length === 0 ? (
        <div className="rounded-3xl bg-amber-100 p-8 text-center space-y-6 border border-amber-200 shadow-card">
          <div className="mx-auto text-4xl bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-sm">✨</div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-navy-900">Nog geen verhalen</h3>
            <p className="text-navy-800/70 text-sm">Maak je eerste bedtijdavontuur in 60 seconden.</p>
          </div>
          <Link href="/wizard" className="block"><Button variant="primary" className="w-full shadow-soft">Start Wizard</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      )}
    </main>
  )
}
