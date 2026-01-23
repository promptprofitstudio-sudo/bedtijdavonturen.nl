'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Chip, Field, Input, SectionTitle } from '@/components/ui'
import { ProgressDots } from '@/components/ProgressDots'
import type { StoryMood } from '@/lib/mockData'
import { generateStoryAction } from '@/app/actions'
import { useAuth } from '@/context/AuthContext'

const moods: StoryMood[] = ['Rustig', 'Grappig', 'Dapper', 'Troost']
const lengths = [5, 7, 10] as const

declare global {
  interface Window {
    posthog: any
  }
}

export default function WizardPage() {
  const router = useRouter()
  const { user, db } = useAuth() // To check auth

  const [step, setStep] = React.useState(1)
  const [childName, setChildName] = React.useState('')
  const [age, setAge] = React.useState<'2-4' | '4-7'>('4-7')
  const [mood, setMood] = React.useState<StoryMood>('Rustig')
  const [minutes, setMinutes] = React.useState<number>(7)
  const [themeInput, setThemeInput] = React.useState('')
  const [contextInput, setContextInput] = React.useState('')

  const [isGenerating, setIsGenerating] = React.useState(false)

  React.useEffect(() => {
    if (step === 1 && window.posthog) {
      window.posthog.capture('wizard_started')
    }
  }, [step])

  const canNext = step === 1 ? childName.trim().length > 0 : true

  const next = () => {
    if (step < 4) {
      if (window.posthog) {
        window.posthog.capture('wizard_step_completed', { step_number: step })
      }
      setStep((s) => s + 1)
    }
  }
  const prev = () => {
    if (step > 1) setStep((s) => s - 1)
  }

  const finish = async () => {
    if (!user) {
      alert('Je moet ingelogd zijn om een verhaal te maken (voorlopig).')
      return
    }

    setIsGenerating(true)

    // Construct FormData for the Server Action
    const formData = new FormData()
    formData.append('userId', user.uid)
    // Fetch real profile ID
    let profileId = 'temp-wizard-profile'
    try {
      const { getProfiles } = await import('@/lib/firebase/db')
      const profiles = await getProfiles(user.uid)
      if (profiles.length > 0) {
        profileId = profiles[0].id
      }
    } catch (e) {
      console.warn('Failed to fetch profile, using temp', e)
    }

    formData.append('profileId', profileId)

    formData.append('childName', childName)
    formData.append('ageGroup', age) // '2-4' matches strict type? Yes.
    formData.append('mood', mood)
    // Theme is optional but Zod Schema says .min(3). 
    // If empty, let's provide a default based on inputs to pass validation.
    const finalTheme = themeInput.trim() || `Een ${mood.toLowerCase()} verhaal`
    formData.append('theme', finalTheme)

    // contextInput is not in the Server Action validation yet (Schema has theme, but not context/excerpt input?)
    // Checking actions.ts Schema: userId, profileId, childName, ageGroup, mood, theme. 
    // That's it. contextInput is ignored for now. Correct.

    try {
      const result = await generateStoryAction(formData)

      if (result.error) {
        alert(result.error)
      } else if (result.success && result.storyId) {
        router.push(`/story/${result.storyId}`)
      }
    } catch (e) {
      console.error(e)
      alert('Er ging iets mis.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="px-5 py-6 space-y-8 pb-40">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle title="Maak verhaal" subtitle="60 seconden — rustig, persoonlijk, klaar." />
          <div className="flex items-center gap-2">
            <div className="text-xs font-bold text-navy-800/60 uppercase tracking-widest">Stap {step}/4</div>
            <ProgressDots step={step} total={4} />
          </div>
        </div>
      </header>

      {/* Step Container with Animation */}
      <div className="space-y-6">
        {step === 1 ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-navy-900">Voor wie is het verhaal?</h2>
              <p className="text-navy-800/60 text-sm">We maken een profiel aan zodat je volgende keer sneller bent.</p>
            </div>

            <Field label="Naam van je kind" hint="Alleen voornaam">
              <Input
                placeholder="Bijv. Noor"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canNext && next()}
                autoFocus
                className="text-2xl font-bold h-16"
              />
            </Field>

            <Field label="Leeftijd" hint="Bepaalt toon & lengte">
              <div className="flex gap-3">
                <Chip selected={age === '2-4'} onClick={() => setAge('2-4')} variant="teal" >2–4 jaar</Chip>
                <Chip selected={age === '4-7'} onClick={() => setAge('4-7')} variant="teal" >4–7 jaar</Chip>
              </div>
            </Field>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-navy-900">Sfeer vanavond</h2>
              <p className="text-navy-800/60 text-sm">Bedtijd = liever rustig. Wij houden het veilig.</p>
            </div>

            <Field label="Kies een gevoel" hint="">
              <div className="flex flex-wrap gap-3">
                {moods.map((m) => (
                  <Chip key={m} selected={mood === m} onClick={() => setMood(m)} variant={m === 'Rustig' ? 'teal' : 'def'}>{m}</Chip>
                ))}
              </div>
            </Field>

            <Field label="Lengte verhaal" hint="">
              <div className="flex gap-3">
                {lengths.map((l) => (
                  <Chip key={l} selected={minutes === l} onClick={() => setMinutes(l)} variant="def">{l} min</Chip>
                ))}
              </div>
            </Field>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-navy-900">Waar gaat het over?</h2>
              <p className="text-navy-800/60 text-sm">Optioneel. Laat leeg voor een verrassing.</p>
            </div>

            <Field label="Thema" hint="Bijv. ruimte, dinos, unicorns">
              <Input
                placeholder="Typ een thema..."
                value={themeInput}
                onChange={(e) => setThemeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canNext && next()}
                autoFocus
                className="h-14"
              />
            </Field>
            <Field label="Vandaag gebeurde..." hint="Bijv. eerste schooldag">
              <Input
                placeholder="Gebeurtenis..."
                value={contextInput}
                onChange={(e) => setContextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canNext && next()}
                className="h-14"
              />
            </Field>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="rounded-2xl bg-gradient-to-br from-navy-900 to-navy-800 p-6 text-white shadow-soft">
              <p className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-2">Samenvatting</p>
              <h2 className="text-2xl font-extrabold mb-1">{childName || 'Je kind'} & het avontuur</h2>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold">{age} jaar</span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold">{mood}</span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold">{minutes} min</span>
              </div>
              <p className="mt-6 text-sm text-navy-100/80">Klaar om te genereren? Dit duurt ongeveer 10 seconden.</p>
            </div>

            <Button size="lg" variant="teal" onClick={finish} disabled={isGenerating} className="w-full text-lg h-16 shadow-soft">
              {isGenerating ? 'Avontuur schrijven...' : '✨ Maak Verhaal'}
            </Button>
          </div>
        ) : null}
      </div>

      {/* Navigation Bar (Glassmorphism above BottomNav) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-moon-50/95 backdrop-blur-xl border-t border-moon-200/60 pb-[calc(88px+env(safe-area-inset-bottom,20px)+24px)] pt-6 px-6 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
          {step > 1 && !isGenerating ? (
            <Button variant="ghost" onClick={prev} className="flex-1 border border-moon-200 bg-white shadow-sm hover:bg-moon-100">Terug</Button>
          ) : <div className="flex-1" />}

          {step < 4 ? (
            <Button onClick={next} disabled={!canNext} variant="primary" className="flex-[2] shadow-teal-glow">
              Volgende
            </Button>
          ) : <div className="flex-[2]" />}
        </div>
      </div>
    </main>
  )
}
