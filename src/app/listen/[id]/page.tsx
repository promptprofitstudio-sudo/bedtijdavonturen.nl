import Link from 'next/link'
import { Card, Pill } from '@/components/ui'
import { AudioPlayer } from '@/components/AudioPlayer'
import { GenerateAudioButton } from '@/components/GenerateAudioButton'
import { getStory } from '@/lib/firebase/admin-db'

export default async function ListenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const story = await getStory(id)

  if (!story) return <div className="p-8 text-center font-bold text-navy-900">Verhaal niet gevonden</div>

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

      {/* Dynamic Content: Player OR Generator */}
      {story.audioUrl ? (
        <AudioPlayer title={story.title} src={story.audioUrl} />
      ) : (
        <Card className="border-dashed border-2 bg-white/50">
          <GenerateAudioButton storyId={story.id} />
        </Card>
      )}

      {/* Tip Card */}
      <div className="rounded-xl bg-indigo-900 p-4 text-white shadow-soft">
        <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">Tip</p>
        <p className="text-sm font-medium">Zet dit aan en leg de telefoon weg. Het verhaal stopt vanzelf.</p>
      </div>
    </main>
  )
}
