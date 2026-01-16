import Link from 'next/link'
import { Button, Card, Pill } from '@/components/ui'
import { cn } from '@/lib/utils'
import { getStory } from '@/lib/firebase/db'

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const story = await getStory(id)

  if (!story) return <div>Verhaal niet gevonden</div>

  const isToddler = story.ageGroup === '2-4'

  // Theme classes based on age
  const bgClass = isToddler ? 'bg-ink-950' : 'bg-ink-950' // Outer background
  const textClass = isToddler ? 'text-ink-200' : 'text-amber-100'

  return (
    <main className={cn("min-h-screen px-4 py-6 space-y-6", bgClass, textClass)}>
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/library" className="text-sm font-semibold underline opacity-70 hover:opacity-100">← Bibliotheek</Link>
          <Pill>{story.mood}</Pill>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight leading-tight">{story.title}</h1>
        <p className="text-xs opacity-70">
          Voor {story.childName} • {story.minutes} min • {isToddler ? 'Ouder Modus' : 'Amber Leesmodus'}
        </p>
      </header>

      {/* SAFETY WARNING FOR TODDLERS */}
      {isToddler && (
        <div className="rounded-xl bg-rose-950/30 border border-rose-900/50 p-4 mb-6">
          <p className="text-xs font-bold text-rose-200 uppercase tracking-wide mb-1">⚠️ Bedtime Safety</p>
          <p className="text-sm text-rose-100/80">
            Schermgebruik wordt afgeraden voor 2-4 jaar. <br />
            Leg je telefoon weg en vertel dit verhaal of speel de audio.
          </p>
        </div>
      )}

      {/* CONTENT AREA */}
      <div
        className={cn(
          "rounded-2xl shadow-soft border relative overflow-hidden transition-colors duration-500",
          isToddler ? "bg-black border-ink-900" : "bg-[#FFFBF0] border-stone-200"
        )}
      >

        {/* TODDLER MODE: AUDIO FOCUS, HIDDEN TEXT */}
        {isToddler ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-8">
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse group-hover:bg-indigo-500/30 transition-all" />
              <button className="relative w-24 h-24 rounded-full bg-ink-900 border border-ink-700 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-300">
                {/* Simple Play Icon SVG */}
                <svg className="w-10 h-10 text-indigo-300 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </button>
            </div>

            <div className="text-center space-y-2 max-w-[200px]">
              <p className="font-bold text-lg text-indigo-100">Audio Starten</p>
              <p className="text-xs text-ink-400">Scherm wordt gedimd na start.</p>
            </div>

            {/* Fallback text for parent */}
            <details className="w-full text-xs text-ink-600 mt-8 px-6">
              <summary className="mb-4 cursor-pointer hover:text-ink-400 text-center list-none">
                <span className="border-b border-ink-800 p-1">Toon tekst (voorlezen)</span>
              </summary>
              <div className="space-y-4 text-base leading-relaxed text-ink-300 font-serif">
                {story.body.map((b, idx) => (
                  <p key={idx}>{b.text}</p>
                ))}
              </div>
            </details>
          </div>
        ) : (
          /* PRESCHOOLER MODE: AMBER READER + DIALOGIC PROMPTS */
          <div className="p-6 sm:p-8 space-y-6 text-lg leading-8 text-stone-800 font-serif">
            {story.body.map((b, idx) => {
              const prompt = story.dialogicPrompts?.find(p => p.pausePoint === idx)

              return (
                <div key={idx} className="transition-opacity duration-700">
                  {/* Render Paragraph */}
                  {b.type === 'pause' ? (
                    <div className="my-6 pl-4 border-l-4 border-amber-300/50 italic text-stone-500 text-base font-sans">
                      {b.text}
                    </div>
                  ) : (
                    <p className="mb-6 first-letter:text-3xl first-letter:font-bold first-letter:mr-1 first-letter:float-left first-letter:text-amber-600">{b.text}</p>
                  )}

                  {/* Render Dialogic Prompt */}
                  {prompt && (
                    <div className="my-8 rounded-xl bg-amber-50 border border-amber-100 p-5 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-colors">
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber-400/30" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg animate-floaty">💬</span>
                          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest font-sans">Samen Praten</p>
                        </div>
                        <p className="text-lg font-semibold text-amber-900 font-sans italic">
                          &ldquo;{prompt.question}&rdquo;
                        </p>
                        <p className="text-xs text-amber-700/60 mt-3 font-sans">
                          Tip: {prompt.context}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            <div className="mt-12 flex justify-center">
              <span className="text-2xl opacity-30 select-none">❦</span>
            </div>
          </div>
        )}
      </div>

      <Card className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {!isToddler && <Link href={`/story/${story.id}`}><Button variant="secondary" className="w-full">Lees</Button></Link>}
          <Link href={`/listen/${story.id}`}><Button variant="secondary" className="w-full">Luister</Button></Link>
          <Button variant="secondary" onClick={() => alert('PDF export komt via backend')} className="w-full">Print</Button>
        </div>
      </Card>
    </main>
  )
}
