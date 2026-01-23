'use client'

import { useState } from 'react'
import { Button, Card } from '@/components/ui'
import { VoiceRecorder } from '@/components/VoiceRecorder'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function VoiceCloningPage() {
    const { user } = useAuth()
    const [success, setSuccess] = useState(false)

    return (
        <main className="min-h-screen bg-navy-50 p-6">
            <div className="max-w-2xl mx-auto space-y-8">
                <header>
                    <Link href="/account" className="text-sm font-bold text-navy-600 hover:text-navy-900 mb-4 inline-block">← Terug naar account</Link>
                    <h1 className="text-3xl font-extrabold text-navy-900">Jouw Stem Klonen</h1>
                    <p className="text-navy-600 mt-2">Spreek nu direct in op je mobiel (1-2 minuten) zodat de AI voorleest met jouw stem.</p>
                </header>

                <Card className="p-6 space-y-6">
                    {success ? (
                        <div className="text-center space-y-4 py-8">
                            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl">✅</div>
                            <h2 className="text-xl font-bold text-navy-900">Stem succesvol gekloond!</h2>
                            <p className="text-navy-600">Je volgende verhaal wordt automatisch voorgelezen met jouw stem.</p>
                            <Link href="/library">
                                <Button>Maak een nieuw verhaal</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                                <h3 className="font-bold text-indigo-900 mb-2">Instructies</h3>
                                <ul className="list-disc list-inside text-sm text-indigo-700 space-y-1">
                                    <li>Zorg voor een stille omgeving.</li>
                                    <li>Druk op <strong>Start Opname</strong> en lees rustig voor.</li>
                                    <li>Minimaal 30 seconden spreken.</li>
                                </ul>
                            </div>

                            {user && <VoiceRecorder userId={user.uid} onUploadComplete={() => setSuccess(true)} />}
                        </div>
                    )}
                </Card>
            </div>
        </main>
    )
}
