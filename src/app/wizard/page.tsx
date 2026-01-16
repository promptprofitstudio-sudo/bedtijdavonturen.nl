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

  const canNext = step === 1 ? childName.trim().length > 0 : true

  const next = () => {
    if (step < 4) setStep((s) => s + 1)
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
    <main className="px-4 py-6 space-y-6">
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitle title="Maak verhaal" subtitle="60 seconden — rustig, persoonlijk, klaar." />
          <ProgressDots step={step} total={4} />
        </div>
      </header>

      <Card className="space-y-5">
        {step === 1 ? (
          <div className="space-y-4">
            <Field label="Naam van je kind" hint="Alleen voornaam">
              <Input
                placeholder="Bijv. Noor"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                autoFocus
              />
            </Field>
            <Field label="Leeftijd" hint="Voor toon & lengte">
              <div className="flex gap-2">
                <Chip selected={age === '2-4'} onClick={() => setAge('2-4')}>2–4</Chip>
                <Chip selected={age === '4-7'} onClick={() => setAge('4-7')}>4–7</Chip>
              </div>
            </Field>
            <p className="text-xs text-ink-800/70">
              We slaan dit straks op als profiel — zodat je morgen in 1 tik verder kunt.
            </p>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <Field label="Sfeer vanavond" hint="Bedtijd = liever rustig">
              <div className="flex flex-wrap gap-2">
                {moods.map((m) => (
                  <Chip key={m} selected={mood === m} onClick={() => setMood(m)}>{m}</Chip>
                ))}
              </div>
            </Field>
            <Field label="Lengte" hint="Kies wat haalbaar is">
              <div className="flex gap-2">
                {lengths.map((l) => (
                  <Chip key={l} selected={minutes === l} onClick={() => setMinutes(l)}>{l} min</Chip>
                ))}
              </div>
            </Field>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <Field label="Thema (optioneel)" hint="Laat leeg voor verrassing">
              <Input
                placeholder="Bijv. ruimte, dinos, unicorns…"
                value={themeInput}
                onChange={(e) => setThemeInput(e.target.value)}
              />
            </Field>
            <Field label="Vandaag gebeurde… (optioneel)" hint="1 zin is genoeg">
              <Input
                placeholder="Bijv. spannende dag op school"
                value={contextInput}
                onChange={(e) => setContextInput(e.target.value)}
              />
            </Field>
            <p className="text-xs text-ink-800/70">
              Minder is meer: hoe minder input, hoe sneller je in de lees-/luistermodus bent.
            </p>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-moon-100 p-4">
              <p className="text-xs font-semibold text-ink-800/70">Samenvatting</p>
              <p className="mt-1 text-sm font-extrabold">{childName || 'Je kind'} • {age} • {mood} • {minutes} min</p>
              <p className="mt-2 text-xs text-ink-800/70">Je kunt daarna lezen, luisteren (soon) of printen.</p>
            </div>
            <Button size="lg" onClick={finish} disabled={isGenerating}>
              {isGenerating ? 'Aan het schrijven...' : 'Maak verhaal'}
            </Button>
            <p className="text-xs text-ink-800/70">
              Onze AI-schrijver bedenkt nu een uniek verhaal. Dit duurt ongeveer 10 seconden.
            </p>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={prev} disabled={step === 1 || isGenerating}>Terug</Button>
          {step < 4 ? (
            <Button onClick={next} disabled={!canNext}>Volgende</Button>
          ) : null}
        </div>
      </Card>
    </main>
  )
}
