'use client'

import * as React from 'react'
import { Button, Card } from '@/components/ui'
import { formatTime } from '@/lib/timeUtils'

export function AudioPlayer({ title, src }: { title: string; src?: string }) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [screenOff, setScreenOff] = React.useState(false)

  React.useEffect(() => {
    const a = audioRef.current
    if (!a) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onTimeUpdate = () => setCurrentTime(a.currentTime)
    const onLoadedMetadata = () => setDuration(a.duration)
    const onEnded = () => setIsPlaying(false)

    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    a.addEventListener('timeupdate', onTimeUpdate)
    a.addEventListener('loadedmetadata', onLoadedMetadata)
    a.addEventListener('ended', onEnded)

    return () => {
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
      a.removeEventListener('timeupdate', onTimeUpdate)
      a.removeEventListener('loadedmetadata', onLoadedMetadata)
      a.removeEventListener('ended', onEnded)
    }
  }, [])

  const togglePlay = () => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) {
      a.play().catch(() => { })
    } else {
      a.pause()
    }
  }

  const skip = (seconds: number) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = Math.min(Math.max(a.currentTime + seconds, 0), duration)
  }

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current
    if (!a) return
    const time = Number(e.target.value)
    a.currentTime = time
    setCurrentTime(time)
  }

  return (
    <>
      <Card className="space-y-6">
        <div className="space-y-1 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">Nu aan het spelen</p>
          <h2 className="text-xl font-extrabold text-navy-900 leading-tight">{title}</h2>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={src}
          className="hidden"
        />

        {/* Controls Container */}
        <div className="space-y-4">

          {/* Scrubber & Time */}
          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleScrub}
              className="w-full h-2 bg-navy-100 rounded-lg appearance-none cursor-pointer accent-teal-600 hover:accent-teal-700 transition-all"
            />
            <div className="flex justify-between text-xs font-medium text-navy-500 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(duration - currentTime)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(-10)}
              className="text-navy-400 hover:text-navy-700"
              aria-label="10 seconden terug"
            >
              <span className="material-symbols-outlined text-2xl">replay_10</span>
              <span className="sr-only">-10s</span>
            </Button>

            <Button
              variant="teal"
              onClick={togglePlay}
              className="w-16 h-16 rounded-full p-0 flex items-center justify-center shadow-lg shadow-teal-600/30 hover:scale-105 active:scale-95"
            >
              {isPlaying ? (
                <span className="material-symbols-outlined text-4xl">pause</span>
              ) : (
                <span className="material-symbols-outlined text-4xl">play_arrow</span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(10)}
              className="text-navy-400 hover:text-navy-700"
              aria-label="10 seconden vooruit"
            >
              <span className="material-symbols-outlined text-2xl">forward_10</span>
              <span className="sr-only">+10s</span>
            </Button>
          </div>

        </div>

        {/* Screen Off Toggle */}
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            onClick={() => setScreenOff(true)}
            className="flex items-center gap-2 px-4 h-12 py-2 text-sm font-medium text-navy-600 bg-navy-50 rounded-full hover:bg-navy-100"
          >
            <span className="material-symbols-outlined text-base">brightness_low</span>
            Scherm uit
          </Button>
        </div>
      </Card>

      {/* Screen Off Overlay */}
      {screenOff ? (
        <div
          className="fixed inset-0 z-[100] bg-black animate-in fade-in duration-700"
          role="dialog"
          aria-label="Scherm uit"
          onClick={() => setScreenOff(false)}
        >
          <div className="flex items-center justify-center h-full">
            <div className="absolute bottom-10 left-0 right-0 mx-auto max-w-xs px-6">
              <div className="rounded-full bg-white/10 p-3 text-center text-sm font-medium text-white/50 backdrop-blur-md border border-white/5">
                Tik ergens om wakker te worden
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
