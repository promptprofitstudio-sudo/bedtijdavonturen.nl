'use client'

import * as React from 'react'
import { Button, Card } from '@/components/ui'

export function AudioPlayer({ title, src }: { title: string; src?: string }) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [screenOff, setScreenOff] = React.useState(false)

  React.useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    return () => {
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
    }
  }, [])

  const toggle = async () => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) {
      try { await a.play() } catch {}
    } else {
      a.pause()
    }
  }

  return (
    <>
      <Card className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-ink-800/70">Luistermodus</p>
          <h2 className="text-lg font-extrabold leading-tight">{title}</h2>
        </div>

        <audio
          ref={audioRef}
          src={src}
          controls
          className="w-full"
        />

        <div className="grid grid-cols-2 gap-3">
          <Button size="lg" onClick={toggle}>
            {isPlaying ? 'Pauze' : 'Afspelen'}
          </Button>
          <Button size="lg" variant="secondary" onClick={() => setScreenOff(true)}>
            Scherm uit
          </Button>
        </div>

        <p className="text-xs text-ink-800/70">
          Tip: zet je telefoon op ‘Niet storen’ voor een rustige avond.
        </p>
      </Card>

      {screenOff ? (
        <div
          className="fixed inset-0 z-[60] bg-black"
          role="dialog"
          aria-label="Scherm uit"
          onClick={() => setScreenOff(false)}
        >
          <div className="absolute bottom-8 left-0 right-0 mx-auto max-w-md px-4">
            <div className="rounded-2xl bg-white/10 p-3 text-center text-sm text-white/90 backdrop-blur">
              Tik om scherm weer aan te zetten
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
