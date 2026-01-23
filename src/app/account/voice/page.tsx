'use client'

import { useState } from 'react'
import { Button, Card } from '@/components/ui'
import { cloneVoiceAction } from '@/app/actions/voice'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function VoiceCloningPage() {
    const { user } = useAuth()
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !user) return

        setLoading(true)
        setError(null)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('userId', user.uid)

        const result = await cloneVoiceAction(formData)

        setLoading(false)
        if (result.success) {
            setSuccess(true)
        } else {
            setError(result.error || 'Er ging iets mis bij het uploaden.')
        }
    }

    return (
        <main className="min-h-screen bg-navy-50 p-6">
            <div className="max-w-2xl mx-auto space-y-8">
                <header>
                    <Link href="/account" className="text-sm font-bold text-navy-600 hover:text-navy-900 mb-4 inline-block">← Terug naar account</Link>
                    <h1 className="text-3xl font-extrabold text-navy-900">Jouw Stem Klonen</h1>
                    <p className="text-navy-600 mt-2">Upload een opname van jezelf (1-2 minuten) zodat de AI voorleest met jouw stem.</p>
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
                        <form onSubmit={handleUpload} className="space-y-6">
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                                <h3 className="font-bold text-indigo-900 mb-2">Instructies</h3>
                                <ul className="list-disc list-inside text-sm text-indigo-700 space-y-1">
                                    <li>Zorg voor een stille omgeving (geen achtergrondgeluid).</li>
                                    <li>Spreek rustig en duidelijk, zoals je voorleest.</li>
                                    <li>Opname moet minimaal 1 minuut duren voor goed resultaat.</li>
                                    <li>Bestandsformaat: MP3, WAV.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-navy-900">Kies audiobestand</label>
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-slate-500
                                      file:mr-4 file:py-2 file:px-4
                                      file:rounded-full file:border-0
                                      file:text-sm file:font-semibold
                                      file:bg-teal-50 file:text-teal-700
                                      hover:file:bg-teal-100"
                                />
                                {file && (
                                    <p className="text-xs text-navy-500">Geselecteerd: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                                )}
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={!file || loading}
                                variant="teal"
                                className="w-full"
                            >
                                {loading ? 'Bezig met uploaden en klonen...' : 'Start Stemklonen (Instant)'}
                            </Button>
                        </form>
                    )}
                </Card>
            </div>
        </main>
    )
}
