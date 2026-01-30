import Link from 'next/link'
import { Card, Pill, Button } from '@/components/ui'
import { AudioPlayer } from '@/components/AudioPlayer'
import { GenerateAudioButton } from '@/components/GenerateAudioButton'
import { getStory } from '@/lib/firebase/admin-db'
import { ShareButton } from '@/components/ShareButton'

import { getCurrentUser } from '@/lib/firebase/server-auth'

export default async function ListenPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ token?: string }>
}) {
  const { id } = await params
  const { token } = await searchParams

  const story = await getStory(id)
  if (!story) return <div className="p-8 text-center font-bold text-navy-900">Verhaal niet gevonden</div>

  // Access Control
  const user = await getCurrentUser()
  const isOwner = user && user.uid === story.userId
  const isPublicShare = token && story.shareToken === token

  // Fetch Voice Status (if needed for generator)
  let hasClonedVoice = false
  let credits = 0
  let subStatus = 'free'

  if (!story.audioUrl) {
    const { getAdminDb } = await import('@/lib/firebase/admin')
    const db = await getAdminDb()
    const userDoc = await db.collection('users').doc(story.userId).get()
    const userData = userDoc.data()
    hasClonedVoice = !!userData?.customVoiceId
    credits = userData?.credits ?? 0
    subStatus = userData?.subscriptionStatus || 'free'
  }

  // Welcome Badge Logic (First Time Experience)
  const showWelcomeBadge = credits === 1 && subStatus === 'free'

  if (!isOwner && !isPublicShare) {
    if (!user) {
      // Public user trying to access without token
      return (
        <main className="min-h-screen bg-navy-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <h1 className="text-2xl font-bold text-navy-900">Dit verhaal is privé 🔒</h1>
          <p className="text-navy-600">Alleen de maker of mensen met een speciale link kunnen dit luisteren.</p>
          <Link href="/">
            <Button variant="primary">Naar Home</Button>
          </Link>
        </main>
      )
    }
    return <div className="p-8 text-center text-red-500 font-bold">Geen toegang tot dit verhaal.</div>
  }

  return (
    <main className="px-5 py-6 space-y-6 min-h-screen bg-navy-50">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <Link href={`/story/${story.id}`} className="text-sm font-bold text-navy-600 hover:text-navy-900 transition-colors">← Terug naar lezen</Link>
          <Pill>{story.mood}</Pill>
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Luister</h1>
          <p className="text-sm font-medium text-navy-500">Voor {story.childName} • {story.minutes} min</p>
        </div>
      </header>

      {/* Access Control & Sharing UI */}
      {
        isOwner && (
          <Card className="bg-indigo-50 border-indigo-100">
            <ShareButton storyId={story.id} userId={story.userId} currentShareToken={story.shareToken} />
          </Card>
        )
      }

      {/* Dynamic Content: Player OR Generator */}
      {
        story.audioUrl ? (
          <AudioPlayer title={story.title} src={story.audioUrl} />
        ) : (
          <Card className="border-dashed border-2 bg-white/50">
            <GenerateAudioButton
              storyId={story.id}
              userId={story.userId}
              hasClonedVoice={hasClonedVoice}
              credits={credits}
              showWelcomeBadge={showWelcomeBadge} // [NEW] Pass badge state
            />
          </Card>
        )
      }

      {/* Tip Card */}
      <div className="rounded-xl bg-indigo-900 p-4 text-white shadow-soft">
        <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">Tip</p>
        <p className="text-sm font-medium">Zet dit aan en leg de telefoon weg. Het verhaal stopt vanzelf.</p>
      </div>
    </main >
  )
}
