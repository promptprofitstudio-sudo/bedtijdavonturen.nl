'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export function ToddlerPlayer({ audioUrl }: { audioUrl?: string }) {
    const audioRef = React.useRef<HTMLAudioElement | null>(null)
    const [isPlaying, setIsPlaying] = React.useState(false)

    const togglePlay = () => {
        if (!audioRef.current || !audioUrl) return
        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play().catch(e => console.error("Play failed", e))
        }
    }

    React.useEffect(() => {
        const a = audioRef.current
        if (!a) return

        const onPlay = () => setIsPlaying(true)
        const onPause = () => setIsPlaying(false)
        const onEnded = () => setIsPlaying(false)

        a.addEventListener('play', onPlay)
        a.addEventListener('pause', onPause)
        a.addEventListener('ended', onEnded)
        return () => {
            a.removeEventListener('play', onPlay)
            a.removeEventListener('pause', onPause)
            a.removeEventListener('ended', onEnded)
        }
    }, [])

    return (
        <div className="flex flex-col items-center justify-center space-y-8">
            <audio ref={audioRef} src={audioUrl} className="hidden" />

            <button
                onClick={togglePlay}
                disabled={!audioUrl}
                className="group relative flex items-center justify-center outline-none focus-visible:ring-4 focus-visible:ring-teal-400 rounded-full transition-all"
            >
                {/* Glow Effect */}
                <div className={cn(
                    "absolute inset-0 bg-teal-500/20 rounded-full blur-2xl transition-all duration-500",
                    isPlaying ? "scale-125 bg-teal-400/30 animate-pulse" : "group-hover:bg-teal-500/30"
                )} />

                {/* Main Button Circle */}
                <div className={cn(
                    "relative h-24 w-24 rounded-full bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-900/50 transition-transform active:scale-95",
                    isPlaying && "scale-95 bg-teal-600"
                )}>
                    {isPlaying ? (
                        <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                    ) : (
                        <svg className="w-10 h-10 text-white ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    )}
                </div>
            </button>

            {!audioUrl && <p className="text-red-400 text-sm">Geen audio beschikbaar.</p>}
        </div>
    )
}
