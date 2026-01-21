import Link from 'next/link'
import { Button, Card, Chip, SectionTitle, Pill } from '@/components/ui'
import { StoryCard } from '@/components/StoryCard'
import { sampleStories } from '@/lib/mockData'

const moods = ['Rustig', 'Grappig', 'Dapper', 'Troost'] as const

export default function HomePage() {
  return (
    <main className="px-4 py-6 space-y-6">
      <header className="space-y-6 pt-2">
        {/* Logo Header */}
        <div className="flex items-center justify-center py-2">
          <h1 className="text-2xl font-black text-navy-900 tracking-tight">
            Bedtijd<span className="text-teal-500">Avonturen</span>
          </h1>
        </div>

        {/* Hero Card: "Vanavond" */}
        <div className="relative overflow-hidden rounded-3xl bg-navy-900 p-6 text-white shadow-soft">
          <div className="relative z-10 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                <span>●</span> <span>Vanavond</span>
              </div>
              <h2 className="text-2xl font-extrabold leading-tight">
                Vanavond een verhaal in 60 sec.
              </h2>
              <p className="text-navy-200 text-sm font-medium">Rustig • Persoonlijk • Bedtijd-safe</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Chip variant="teal">Rustig</Chip>
              <Chip variant="def">Grappig</Chip>
              <Chip variant="def">Dapper</Chip>
            </div>

            <div className="bg-navy-800/50 rounded-2xl p-5 border border-white/10 mt-6 backdrop-blur-sm">
              <h3 className="font-bold text-lg mb-1">Maak het verhaal</h3>
              <p className="text-navy-200 text-sm mb-4">Naam, thema, gevoel, lengte - klaar.</p>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/wizard" className="contents">
                  <Button variant="teal" size="lg" className="w-full text-sm">Start wizard</Button>
                </Link>
                <Link href="/library" className="contents">
                  <Button variant="ghost" className="w-full text-white hover:bg-white/10 hover:text-white text-sm">Favorieten</Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Decorative Gradient Blob */}
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />
        </div>
      </header>

      <section className="space-y-4">
        <SectionTitle title="Drie manieren om te gebruiken" subtitle="Kies wat past bij vanavond." />
        <div className="grid gap-3">
          <Card className="flex items-center gap-4 p-4 hover:border-teal-400 cursor-pointer transition-colors group">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📖</div>
            <div>
              <h4 className="font-bold text-navy-900">Lees</h4>
              <p className="text-xs text-navy-800/60">Dim-modus voor in het donker</p>
            </div>
          </Card>
          <Card className="flex items-center gap-4 p-4 hover:border-teal-400 cursor-pointer transition-colors group">
            <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🎧</div>
            <div>
              <h4 className="font-bold text-navy-900">Luister</h4>
              <p className="text-xs text-navy-800/60">Scherm uit, audio aan</p>
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-4 pb-20">
        <div className="bg-gradient-to-r from-teal-50 to-moon-100 rounded-3xl p-6 border border-teal-100">
          <div className="space-y-2">
            <Pill variant="teal">Nieuw: Serie-universum</Pill>
            <h3 className="text-xl font-extrabold text-navy-900">Terugkerende vriendjes</h3>
            <p className="text-sm text-navy-800/70">Wist je dat kinderen beter slapen bij herhaling? Maak een vervolg op gisteravond.</p>
            <Button variant="primary" className="w-full mt-2">Start een serie</Button>
          </div>
        </div>
      </section>
    </main>
  )
}
