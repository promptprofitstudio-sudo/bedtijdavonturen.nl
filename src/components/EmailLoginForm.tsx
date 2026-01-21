'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'

export function EmailLoginForm() {
    const { signInWithEmail, registerWithEmail } = useAuth()
    const [isRegister, setIsRegister] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            if (isRegister) {
                await registerWithEmail(email, password, name)
            } else {
                await signInWithEmail(email, password)
            }
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Er ging iets mis')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4 pt-4 border-t border-navy-100">
            <h3 className="text-sm font-bold text-navy-900 text-center">
                Of met e-mail
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
                {isRegister && (
                    <input
                        type="text"
                        placeholder="Voornaam"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-navy-200 p-3 text-sm"
                        required
                    />
                )}
                <input
                    type="email"
                    placeholder="E-mailadres"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-navy-200 p-3 text-sm"
                    required
                />
                <input
                    type="password"
                    placeholder="Wachtwoord (min. 6 tekens)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-navy-200 p-3 text-sm"
                    required
                />

                {error && <p className="text-xs text-red-500 text-center">{error}</p>}

                <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                    {loading ? 'Laden...' : (isRegister ? 'Account Aanmaken' : 'Inloggen')}
                </Button>
            </form>

            <p className="text-center text-xs text-navy-500">
                {isRegister ? 'Heb je al een account?' : 'Nieuw hier?'}
                {isRegister ? 'Heb je al een account?' : 'Nieuw hier?'}
                <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setIsRegister(!isRegister)}
                    className="ml-1 text-teal-600 font-bold underline hover:bg-transparent hover:text-teal-700 h-auto px-1 py-0"
                    type="button"
                >
                    {isRegister ? 'Log in' : 'Maak account'}
                </Button>
            </p>
        </div >
    )
}
