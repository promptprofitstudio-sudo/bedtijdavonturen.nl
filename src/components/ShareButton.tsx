'use client'

import { useState } from 'react'
import { Button } from './ui'
import { generateShareToken } from '@/app/actions/share'

interface ShareButtonProps {
    storyId: string
    userId: string
    currentShareToken?: string | null
}

export function ShareButton({ storyId, userId, currentShareToken }: ShareButtonProps) {
    const [token, setToken] = useState<string | null>(currentShareToken || null)
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleShare = async () => {
        if (token) {
            copyToClipboard(token)
            return
        }

        setLoading(true)
        const result = await generateShareToken(storyId, userId)
        setLoading(false)

        if (result.success && result.token) {
            setToken(result.token)
            copyToClipboard(result.token)
        } else {
            alert('Kon geen link maken: ' + result.error)
        }
    }

    const copyToClipboard = (t: string) => {
        // Construct full URL
        const url = `${window.location.origin}/listen/${storyId}?token=${t}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
    }

    if (token) {
        return (
            <div className="space-y-2">
                <Button
                    variant="soft"
                    onClick={() => copyToClipboard(token)}
                    className="w-full h-10 text-sm relative"
                >
                    {copied ? 'Link Gekopieerd! ✅' : '🔗 Deel Link opnieuw kopiëren'}
                </Button>
                {copied && <p className="text-xs text-center text-green-600">Link staat op je klembord! Stuur hem naar opa & oma.</p>}
            </div>
        )
    }

    return (
        <Button
            variant="soft"
            onClick={handleShare}
            disabled={loading}
            className="w-full h-10 text-sm"
        >
            {loading ? '...' : (
                <div className="flex items-center gap-1">
                    <span>🔗</span> <span>Deel</span>
                </div>
            )}
        </Button>
    )
}
