'use client'

import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'

export function PartnerGiftBanner() {
    const { user } = useAuth()
    const [daysLeft, setDaysLeft] = useState<number | null>(null)

    useEffect(() => {
        if (user?.subscriptionStatus === 'trial' && user?.trialEndsAt) {
            const left = Math.ceil((user.trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24))
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDaysLeft(left)
        }
    }, [user])

    if (!daysLeft || daysLeft <= 0) return null

    return (
        <div className="bg-indigo-600 text-white text-xs font-medium px-4 py-2 text-center shadow-md animate-in slide-in-from-top-2">
            🎁 <strong>Partner Cadeau:</strong> Nog {daysLeft} dagen gratis luisteren!
        </div>
    )
}
