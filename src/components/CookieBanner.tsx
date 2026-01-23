'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'

import posthog from 'posthog-js'

export function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const consented = localStorage.getItem('cookie_consent')
        if (!consented) {
            // Show banner after a short delay for smooth entrance
            const timer = setTimeout(() => setIsVisible(true), 1000)
            return () => clearTimeout(timer)
        }
    }, [])

    const accept = () => {
        localStorage.setItem('cookie_consent', 'true')
        posthog.opt_in_capturing()
        setIsVisible(false)
    }

    const decline = () => {
        localStorage.setItem('cookie_consent', 'false')
        posthog.opt_out_capturing()
        setIsVisible(false)
    }

    if (!isVisible) return null
    // Pop-up modal style (Centered with Overlay)
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-950/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <div className="w-full max-w-sm bg-white border border-moon-200 p-6 rounded-3xl shadow-xl animate-in zoom-in-95 duration-300">
                <div className="space-y-4">
                    <div className="space-y-2 text-center">
                        <h3 className="font-bold text-lg text-navy-900">🍪 Cookies & Privacy</h3>
                        <p className="text-sm text-navy-800/80 leading-relaxed">
                            We gebruiken cookies om je sessie te bewaren en onze app te verbeteren.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button
                            variant="teal"
                            size="md"
                            onClick={accept}
                            className="w-full font-bold shadow-soft"
                        >
                            Accepteren
                        </Button>
                        <Button
                            variant="ghost"
                            size="md"
                            onClick={decline}
                            className="w-full text-navy-600 hover:text-navy-900"
                        >
                            Weigeren
                        </Button>
                        <Link href="/privacy" className="text-xs text-center text-navy-400 hover:text-navy-600 underline">
                            Lees privacybeleid
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
