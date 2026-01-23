'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { generateAudioAction } from '@/app/actions/audio'
import { useRouter } from 'next/navigation'

export function GenerateAudioButton({ storyId, userId }: { storyId: string, userId: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const res = await generateAudioAction(storyId)
            if (res.success) {
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
        <Button
            variant="primary"
            className="w-full h-12 text-lg shadow-soft"
            onClick={handleGenerate}
            disabled={loading}
        >
            {loading ? 'Bezig met genereren...' : '✨ Genereer Audio (1 Credit)'}
        </Button>
    )
}
