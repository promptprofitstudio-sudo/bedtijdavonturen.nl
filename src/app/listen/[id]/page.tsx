import Link from 'next/link'
import { Card, Pill } from '@/components/ui'
import { AudioPlayer } from '@/components/AudioPlayer'
import { getStoryById } from '@/lib/mockData'

export default async function ListenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const story = getStoryById(id)

  if (!story) return <div>Verhaal niet gevonden</div>

  return (
    <main className="px-4 py-6 space-y-6">
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <Link href={`/story/${story.id}`} className="text-sm font-semibold underline">← Terug</Link>
          <Pill>{story.mood}</Pill>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Luister</h1>
        <p className="text-sm text-ink-800/80">Voor {story.childName} • {story.minutes} min</p>
      </header>

      <AudioPlayer title={story.title} src={undefined} />

      <Card className="space-y-2">
        <p className="text-sm font-extrabold">Audio (roadmap)</p>
        <p className="text-xs text-ink-800/70">
          Koppel hier straks TTS (rustige bedtijdstem) of professionele voice packs. UI is al ingericht voor screen-off.
        </p>
      </Card>
    </main>
  )
}
