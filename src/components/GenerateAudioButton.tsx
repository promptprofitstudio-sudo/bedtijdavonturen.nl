'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { generateAudioAction } from '@/app/actions/audio'

export function GenerateAudioButton({ storyId }: { storyId: string }) {
    const [loading, setLoading] = useState(false)

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const result = await generateAudioAction(storyId)
            if (result.error) {
                console.error('Server Action Error:', result.error)
                throw new Error(result.error)
            }
            // Path revalidation happens on server, page should refresh
        } catch (error) {
            console.error(error)
            const message = error instanceof Error ? error.message : 'Onbekende fout'
            alert(`Fout bij genereren audio: ${message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="text-center space-y-4 py-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-teal-600 mb-4 animate-pulse">
                🎙️
            </div>
            <h3 className="text-lg font-bold text-navy-900">Nog geen audio</h3>
            <p className="text-sm text-navy-800/70 max-w-xs mx-auto">
                Maak een voorleesversie met onze rustige AI-stem.
            </p>
            <Button
                onClick={handleGenerate}
                disabled={loading}
                variant="teal"
                size="lg"
                className="w-full max-w-xs shadow-soft"
            >
                {loading ? 'Genereren (10s)...' : '✨ Maak Audio (Gratis)'}
            </Button>
            <p className="text-xs text-navy-400">Wordt opgeslagen in je bibliotheek.</p>
        </div>
    )
}
