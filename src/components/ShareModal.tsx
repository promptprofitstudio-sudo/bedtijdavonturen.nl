'use client'

import * as React from 'react'
import { Button, Card } from '@/components/ui'

interface ShareModalProps {
    isOpen: boolean
    onClose: () => void
    url: string
    title: string
}

export function ShareModal({ isOpen, onClose, url, title }: ShareModalProps) {
    if (!isOpen) return null

    const handleCopy = () => {
        navigator.clipboard.writeText(url)
        alert('Link gekopieerd!')
    }

    const encodedUrl = encodeURIComponent(url)
    const encodedTitle = encodeURIComponent(title)

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-extrabold text-navy-900">Deel dit verhaal 🌟</h3>
                    <p className="text-sm text-navy-600 font-medium">Kies hoe je wilt delen</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <a
                        href={`https://wa.me/?text=${encodedTitle}%20-%20${encodedUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contents"
                    >
                        <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white shadow-soft h-14 text-lg">
                            💬 WhatsApp
                        </Button>
                    </a>

                    <a
                        href={`mailto:?subject=${encodedTitle}&body=Luister naar dit verhaal: ${encodedUrl}`}
                        className="contents"
                    >
                        <Button variant="secondary" className="w-full h-14 text-lg">
                            ✉️ Email
                        </Button>
                    </a>

                    <Button onClick={handleCopy} variant="soft" className="w-full h-14 text-lg">
                        🔗 Kopieer Link
                    </Button>
                </div>

                <Button onClick={onClose} variant="ghost" className="w-full text-navy-400">
                    Annuleren
                </Button>
            </div>
        </div>
    )
}
