'use client'

import { useAuth } from '@/context/AuthContext'

export function PartnerGiftBanner() {
    const { user } = useAuth()

    if (user?.subscriptionStatus !== 'trial' || !user?.trialEndsAt) return null

    const daysLeft = Math.ceil((user.trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 0) return null

    return (
        <div className="bg-indigo-600 text-white text-xs font-medium px-4 py-2 text-center shadow-md animate-in slide-in-from-top-2">
            🎁 <strong>Partner Cadeau:</strong> Nog {daysLeft} dagen gratis luisteren!
        </div>
    )
}
