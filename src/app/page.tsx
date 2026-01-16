import Link from 'next/link'
import { Button, Card, Chip, SectionTitle } from '@/components/ui'
import { StoryCard } from '@/components/StoryCard'
import { sampleStories } from '@/lib/mockData'

const moods = ['Rustig', 'Grappig', 'Dapper', 'Troost'] as const

export default function HomePage() {
  return (
    <main className="px-4 py-6 space-y-6">
      <header className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-b from-ink-950 to-ink-800 text-moon-50 p-5 shadow-soft overflow-hidden border border-ink-700">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-moon-100/80">Vanavond</p>
              <h1 className="text-2xl font-extrabold tracking-tight">Een rustig verhaal in 60 seconden</h1>
              <p className="text-sm text-moon-100/80">Gepersonaliseerd voor jouw kind. Lees, luister of print — zonder gedoe.</p>
            </div>
            <div className="text-3xl" aria-hidden>🌙</div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {moods.map((m) => (
              <span key={m} className="inline-flex items-center rounded-full bg-white/10 px-3 py-2 text-sm font-semibold">
                {m}
              </span>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link href="/wizard"><Button size="lg" className="w-full">Maak het verhaal</Button></Link>
            <Link href="/pricing"><Button size="lg" variant="secondary" className="w-full">Bekijk plan</Button></Link>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <SectionTitle title="Snel kiezen" subtitle="Kies de sfeer — wij doen de rest." />
        <Card className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {moods.map((m) => (
              <Chip key={m}>{m}</Chip>
            ))}
          </div>
          <p className="text-xs text-ink-800/70">
            Tip: voor bedtijd werkt ‘Rustig’ het best. Je kunt later altijd variëren.
          </p>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle title="Recent" subtitle="Voorbeeldverhalen (mock data)." />
        <div className="space-y-3">
          {sampleStories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Card className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold">Schermvriendelijk</p>
            <p className="text-xs text-ink-800/70">Lees dim, luister met scherm uit, of print een PDF.</p>
          </div>
          <div className="text-2xl" aria-hidden>🛌</div>
        </Card>
      </section>
    </main>
  )
}
