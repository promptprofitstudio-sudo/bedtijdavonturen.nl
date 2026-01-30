'use client'

import { useState } from 'react'
import { Button, Card } from '@/components/ui'
import { redeemCodeAction } from '@/app/actions/referral'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'

export function RedeemCouponForm() {
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const router = useRouter()

    const handleRedeem = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) return

        setLoading(true)
        setMsg(null)

        const res = await redeemCodeAction(code)

        if (res.success) {
            setMsg({ type: 'success', text: res.message || 'Code verzilverd!' })
            setCode('')
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            })
            router.refresh()
        } else {
            setMsg({ type: 'error', text: res.error || 'Ongeldige code.' })
        }
        setLoading(false)
    }

    return (
        <Card className="p-6 bg-white shadow-sm border border-slate-100">
            <h3 className="font-bold text-navy-900 mb-2">Heb je een partnercode? 🎁</h3>
            <p className="text-sm text-slate-500 mb-4">
                Vul de code van je school, kdv of coach in voor een gratis cadeau.
            </p>

            <form onSubmit={handleRedeem} className="flex gap-2">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Bijv. KDV-ZON"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none uppercase"
                    disabled={loading}
                />
                <Button
                    variant="primary"
                    disabled={loading || !code.trim()}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                    {loading ? '...' : 'Verzilver'}
                </Button>
            </form>

            {msg && (
                <p className={`mt-3 text-xs font-medium ${msg.type === 'success' ? 'text-teal-600' : 'text-red-500'}`}>
                    {msg.text}
                </p>
            )}
        </Card>
    )
}
