'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { generateAudioAction } from '@/app/actions/audio'
import { useRouter } from 'next/navigation'

export function GenerateAudioButton({ storyId, userId, hasClonedVoice = false, credits = 0 }: { storyId: string, userId: string, hasClonedVoice?: boolean, credits?: number }) {
    const [loading, setLoading] = useState(false)
    const [useCustomVoice, setUseCustomVoice] = useState(true)
    const router = useRouter()

    // Check if user has enough credits
    const canGenerate = credits > 0

    const handleGenerate = async () => {
        if (!canGenerate) return // Double check

        setLoading(true)
        try {
            const res = await generateAudioAction(storyId, { useCustomVoice, force: true })
            if (res.success) {
                router.refresh()
                router.push(`/story/${storyId}?mode=audio`)
            } else {
                alert('Fout: ' + res.error)
            }
        } catch (e) {
            console.error(e)
            alert('Er ging iets mis.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full space-y-4">
            {hasClonedVoice && (
                <div className="bg-navy-800/50 p-3 rounded-xl border border-navy-700 flex items-center justify-between">
                    <span className="text-sm text-navy-200">Gebruik mijn stem</span>
                    <button
                        onClick={() => setUseCustomVoice(!useCustomVoice)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${useCustomVoice ? 'bg-teal-500' : 'bg-navy-600'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${useCustomVoice ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>
            )}

            {canGenerate ? (
                <Button
                    variant="primary"
                    className="w-full h-12 text-lg shadow-soft"
                    onClick={handleGenerate}
                    disabled={loading}
                >
                    {loading ? 'Bezig met genereren...' : `✨ Genereer Audio (Saldo: ${credits})`}
                </Button>
            ) : (
                <div className="space-y-3">
                    <Button
                        variant="secondary"
                        className="w-full h-12 text-lg opacity-50 cursor-not-allowed"
                        disabled
                    >
                        Geen credits (Saldo: 0)
                    </Button>
                    <p className="text-xs text-center text-red-300">
                        Je hebt geen credits meer. <a href="/pricing" className="underline hover:text-white">Koop nieuwe bundel</a>.
                    </p>
                </div>
            )}
        </div>
    )
}
