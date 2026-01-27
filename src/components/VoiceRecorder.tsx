'use client'

import * as React from 'react'
import { Button } from '@/components/ui'

interface VoiceRecorderProps {
    userId: string
    onUploadComplete?: () => void
}

import { cloneVoiceAction } from '@/app/actions/voice'

export function VoiceRecorder({ userId, onUploadComplete }: VoiceRecorderProps) {
    const [state, setState] = React.useState<'idle' | 'recording' | 'review' | 'uploading'>('idle')
    const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null)
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
    const chunksRef = React.useRef<Blob[]>([])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                setAudioBlob(blob)
                chunksRef.current = [] // Reset
                stream.getTracks().forEach(track => track.stop()) // Stop mic
            }

            mediaRecorderRef.current = recorder
            recorder.start()
            setState('recording')
        } catch (err) {
            console.error('Failed to start recording', err)
            alert('Kan microfoon niet starten.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && state === 'recording') {
            mediaRecorderRef.current.stop()
            setState('review')
        }
    }

    const handleUpload = async () => {
        if (!audioBlob) return
        setState('uploading')

        const formData = new FormData()
        formData.append('file', audioBlob, 'voice_sample.webm')
        formData.append('userId', userId)

        try {
            const result = await cloneVoiceAction(formData)
            if (result.success) {
                if (onUploadComplete) onUploadComplete()
            } else {
                alert('Upload mislukt: ' + result.error)
                setState('review')
            }
        } catch (e) {
            alert('Upload error')
            setState('review')
        }
    }

    const reset = () => {
        setAudioBlob(null)
        setState('idle')
    }

    return (
        <div className="space-y-6 text-center">
            {(state === 'idle' || state === 'recording') && (
                <div className="bg-moon-50 p-6 rounded-2xl border border-moon-100 text-left space-y-3 mb-6">
                    <h3 className="text-navy-900 font-bold flex items-center gap-2">
                        📖 Lees deze tekst hardop voor:
                    </h3>
                    <p className="text-ink-700 leading-relaxed text-lg font-medium">
                        &quot;Hallo! Dit is mijn stem voor Bedtijd Avonturen. Ik lees dit verhaaltje voor om mijn eigen stem te klonen.
                        In een land hier ver vandaan, waar de bomen paars zijn en de rivieren van limonade, woonde een kleine draak.
                        Hij hield van pannenkoeken en warme chocolademelk. Elke avond zong hij een liedje voor de maan, en de sterren luisterden aandachtig mee.
                        Als je goed luistert, hoor je de wind fluisteren door de bladeren. Het is tijd om te gaan slapen, droom zacht en tot morgen!&quot;
                    </p>
                </div>
            )}

            {state === 'idle' && (
                <Button onClick={startRecording} className="w-full bg-teal-500 hover:bg-teal-600 h-16 text-lg rounded-2xl shadow-soft">
                    🎤 Start Opname (30s)
                </Button>
            )}

            {state === 'recording' && (
                <div className="space-y-4 animate-in fade-in">
                    <div className="h-24 w-24 mx-auto rounded-full bg-red-100 flex items-center justify-center animate-pulse">
                        <div className="h-12 w-12 bg-red-500 rounded-full" />
                    </div>
                    <p className="text-navy-600 font-bold">Aan het opnemen...</p>
                    <Button onClick={stopRecording} variant="danger" className="w-full h-14">
                        Stop Opname
                    </Button>
                </div>
            )}

            {state === 'review' && audioBlob && (
                <div className="space-y-4">
                    <p className="text-sm text-green-600 font-bold">Opname klaar! ({Math.round(audioBlob.size / 1024)} KB)</p>

                    {/* Preview */}
                    <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />

                    <div className="grid grid-cols-2 gap-3">
                        <Button onClick={reset} variant="ghost" className="border-2 border-navy-100">
                            Opnieuw
                        </Button>
                        <Button onClick={handleUpload} variant="primary">
                            Verstuur 🚀
                        </Button>
                    </div>
                </div>
            )}

            {state === 'uploading' && (
                <div className="p-8 text-navy-500">
                    <p>Bezig met uploaden...</p>
                </div>
            )}
        </div>
    )
}
