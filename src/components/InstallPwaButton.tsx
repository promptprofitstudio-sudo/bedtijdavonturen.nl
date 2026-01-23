'use client'

import { useEffect, useState } from 'react'
import { Button } from './ui'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPwaButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsStandalone(true)
        }

        // Check iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        setIsIOS(ios)

        // Capture event
        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
        }

        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setDeferredPrompt(null)
        }
    }

    if (isStandalone) return null // Already installed

    if (isIOS) {
        return (
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-sm">
                <p className="font-bold mb-2">Installeer als App 📱</p>
                <p>Tik op <span className="font-bold">Deel</span> en kies <span className="font-bold">Zet op beginscherm</span>.</p>
            </div>
        )
    }

    if (!deferredPrompt) return null // Not installable (or already installed)

    return (
        <Button variant="primary" onClick={handleInstallClick} className="w-full">
            Installeer App 📲
        </Button>
    )
}
