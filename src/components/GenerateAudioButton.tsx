'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { generateAudioAction } from '@/app/actions/audio'
import { useRouter } from 'next/navigation'

export function GenerateAudioButton({ storyId, userId, hasClonedVoice = false }: { storyId: string, userId: string, hasClonedVoice?: boolean }) {
    const [loading, setLoading] = useState(false)
    const [useCustomVoice, setUseCustomVoice] = useState(true)
    const router = useRouter()

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const res = await generateAudioAction(storyId, { useCustomVoice, force: true }) // Force regenerate if clicked
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

            <Button
                variant="primary"
                className="w-full h-12 text-lg shadow-soft"
                onClick={handleGenerate}
                disabled={loading}
            >
                {loading ? 'Bezig met genereren...' : '✨ Genereer Audio (1 Credit)'}
            </Button>
        </div>
    )
}
