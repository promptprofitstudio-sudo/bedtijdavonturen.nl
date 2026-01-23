'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SectionTitle } from '@/components/ui'
import { StoryCard } from '@/components/StoryCard'
import { getUserStories } from '../actions/get-stories'
import { Story } from '@/lib/types'

export default function StoriesPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [stories, setStories] = useState<Story[]>([])
    const [fetching, setFetching] = useState(true)

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    useEffect(() => {
        async function fetchStories() {
            if (user?.uid) {
                try {
                    const data = await getUserStories(user.uid)
                    setStories(data)
                } catch (err) {
                    console.error('Failed to load stories', err)
                } finally {
                    setFetching(false)
                }
            } else if (!loading) {
                setFetching(false)
            }
        }
        fetchStories()
    }, [user, loading])

    if (loading || (fetching && user)) {
        return (
            <main className="px-6 py-8 space-y-8 min-h-[60vh] flex flex-col items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-4 w-32 bg-moon-200 rounded"></div>
                    <div className="h-32 w-full max-w-sm bg-moon-100 rounded-2xl"></div>
                </div>
            </main>
        )
    }

    if (!user) return null // Will redirect

    return (
        <main className="px-6 py-8 space-y-6 animate-in fade-in duration-500">
            <SectionTitle
                title="Mijn Verhalen"
                subtitle="Al jouw magische avonturen op één plek."
            />

            {stories.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                    <p className="text-navy-800/60">Je hebt nog geen verhalen gemaakt.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {stories.map(story => (
                        <StoryCard key={story.id} story={story} />
                    ))}
                </div>
            )}
        </main>
    )
}
