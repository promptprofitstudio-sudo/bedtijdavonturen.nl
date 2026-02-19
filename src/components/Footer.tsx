'use client'

import Link from 'next/link'
import { TrustSignals } from '@/components/TrustSignals'
import { useState, useEffect, useMemo } from 'react'

export function Footer() {
    const [isMounted, setIsMounted] = useState(false)

    // Determine device type (only after mount)
    const deviceType = useMemo(() => {
        if (!isMounted) return 'desktop'
        const width = window.innerWidth
        if (width < 768) {
            return 'mobile'
        } else if (width < 1024) {
            return 'tablet'
        } else {
            return 'desktop'
        }
    }, [isMounted])

    // Set mounted flag
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true)
    }, [])

    return (
        <footer className="px-4 py-8 mt-8 text-center border-t border-moon-100 bg-moon-50/50">
            {/* AU-005: Trust Signals */}
            <div className="mb-8">
                <TrustSignals location="footer" deviceType={deviceType} />
            </div>

            <div className="flex justify-center gap-4 text-xs font-semibold text-navy-600 mb-2">
                <Link href="/privacy" className="hover:underline">Privacy</Link>
                <Link href="/terms" className="hover:underline">Voorwaarden</Link>
            </div>
            <div className="text-[10px] text-ink-400 leading-relaxed">
                <p>&copy; {new Date().getFullYear()} Korpershoek Management B.V.</p>
                <p>KvK 51502062 &bull; Almere</p>
            </div>
        </footer>
    )
}
