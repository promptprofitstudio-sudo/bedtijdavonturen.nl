'use client'

import { useState } from 'react'
import { Button } from './ui'
import { generateShareToken } from '@/app/actions/share'

import { ShareModal } from './ShareModal'

interface ShareButtonProps {
    storyId: string
    userId: string
    currentShareToken?: string | null
    title?: string // Add title prop for better sharing
}

export function ShareButton({ storyId, userId, currentShareToken, title = 'Bedtijdavontuur' }: ShareButtonProps) {
    const [token, setToken] = useState<string | null>(currentShareToken || null)
    const [loading, setLoading] = useState(false)
    const [isModalOpen, setModalOpen] = useState(false)

    const handleShareClick = async () => {
        if (token) {
            setModalOpen(true)
            return
        }

        setLoading(true)
        const result = await generateShareToken(storyId, userId)
        setLoading(false)

        if (result.success && result.token) {
            setToken(result.token)
            setModalOpen(true)
        } else {
            alert('Kon geen link maken: ' + result.error)
        }
    }

    const shareUrl = token ? `${window.location.origin}/listen/${storyId}?token=${token}` : ''

    return (
        <>
            <Button
                variant="soft"
                onClick={handleShareClick}
                disabled={loading}
                className="w-full h-12 text-sm"
            >
                {loading ? '...' : (
                    <div className="flex items-center gap-1">
                        <span>🔗</span> <span>Deel</span>
                    </div>
                )}
            </Button>

            <ShareModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                url={shareUrl}
                title={title}
            />
        </>
    )
}
