import Link from 'next/link'
import { Button, Card, Pill } from '@/components/ui'
import { cn } from '@/lib/utils'
import { getStory } from '@/lib/firebase/admin-db'

export default async function StoryPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ mode?: string }> }) {
  const { id } = await params
  const { mode } = await searchParams
  const story = await getStory(id)

  if (!story) return <div className="p-8 text-center font-bold text-navy-900">Verhaal niet gevonden</div>

  // Force toddler/audio mode if query param set
  const isAudioMode = mode === 'audio'
  const isToddler = story.ageGroup === '2-4' || isAudioMode

  return (
    <main className="min-h-screen bg-navy-950 text-navy-50 font-sans pb-20">

      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-10 bg-navy-950/90 backdrop-blur-md border-b border-navy-800 px-5 h-16 flex items-center justify-between">
        <Link href="/library" className="flex items-center gap-2 text-sm font-bold text-teal-400 hover:text-teal-300 transition-colors">
          <span>←</span> <span>Bibliotheek</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-navy-400">
            {isToddler ? 'Audio Modus' : 'Leesmodus'}
          </span>
          <div className={`h-2 w-2 rounded-full ${isToddler ? 'bg-amber-500' : 'bg-teal-500'}`} />
        </div>
      </header>

      {/* PROGRESS BAR (Visual only for now) */}
      <div className="fixed top-16 left-0 right-0 h-1 bg-navy-900">
        <div className="h-full bg-teal-500 w-1/3 rounded-r-full" />
      </div>

      <div className="px-5 py-8 max-w-lg mx-auto space-y-8">

        {/* TITLE BLOCK */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            {story.title}
          </h1>
          <p className="text-sm font-medium text-navy-300">
            Voor {story.childName} • {story.minutes} min • {story.mood}
          </p>
        </div>

        {/* SAFETY WARNING FOR TODDLERS */}
        {isToddler && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5 text-center">
            <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">⚠️ Schermvrij</p>
            <p className="text-sm text-amber-100/90 leading-relaxed">
              Leg je telefoon weg en vertel dit verhaal, of druk op play. <br />
              <span className="opacity-60">Het scherm dimt automatisch.</span>
            </p>
          </div>
        )}

        {/* CONTENT AREA */}
        <div className="py-2 space-y-8">

          {/* TODDLER MODE: AUDIO FOCUS */}
          {isToddler ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-10">
              {/* Play Button */}
              <button className="group relative flex items-center justify-center">
                <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-2xl group-hover:bg-teal-500/30 transition-all duration-500" />
                <div className="relative h-24 w-24 rounded-full bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-900/50 group-active:scale-95 transition-transform">
                  <svg className="w-10 h-10 text-white ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </button>

              <div className="space-y-6 w-full">
                <details className="group">
                  <summary className="list-none text-center cursor-pointer">
                    <span className="inline-block border-b border-navy-700 pb-1 text-xs font-bold text-navy-400 group-hover:text-teal-400 transition-colors uppercase tracking-widest">
                      Toon tekst voor ouders
                    </span>
                  </summary>
                  <div className="mt-8 space-y-6 text-lg leading-relaxed text-navy-100 font-medium opacity-0 group-open:opacity-100 transition-opacity duration-500">
                    {story.body.map((b, idx) => (
                      <p key={idx}>{b.text}</p>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          ) : (
            /* PRESCHOOLER MODE: DARK READER */
            <div className="space-y-8 text-xl leading-relaxed text-navy-50 font-medium tracking-wide">
              {story.body.map((b, idx) => {
                const prompt = story.dialogicPrompts?.find(p => p.pausePoint === idx)

                return (
                  <div key={idx} className="space-y-8">
                    {/* Render Paragraph */}
                    {b.type === 'pause' ? (
                      <div className="pl-6 border-l-2 border-teal-500/50 text-base text-teal-200/80 italic font-normal py-2">
                        {b.text}
                      </div>
                    ) : (
                      <p className="first-letter:text-4xl first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:text-teal-400">
                        {b.text}
                      </p>
                    )}

                    {/* Dialogic Prompt Card */}
                    {prompt && (
                      <div className="my-10 overflow-hidden rounded-2xl bg-navy-900 border border-teal-500/30 shadow-soft relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent pointer-events-none" />
                        <div className="p-6 relative z-10">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-500/20 text-teal-300 text-lg">💬</span>
                            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Samen Praten</span>
                          </div>
                          <p className="text-lg font-bold text-white italic mb-4">
                            &ldquo;{prompt.question}&rdquo;
                          </p>
                          <div className="flex items-start gap-2 border-t border-white/5 pt-4">
                            <span className="text-navy-400 text-xs uppercase font-bold mt-0.5">Tip:</span>
                            <p className="text-sm text-navy-300/80">{prompt.context}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="pt-12 pb-8 flex justify-center opacity-30">
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-navy-950 border-t border-navy-800 p-4 pb-8">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
          <Link href="/library" className="contents">
            <Button variant="ghost" className="text-navy-300 hover:text-white hover:bg-white/5">Bibliotheek</Button>
          </Link>
          <Button variant="teal" className="shadow-soft">Volgende</Button>
        </div>
      </div>
    </main>
  )
}
