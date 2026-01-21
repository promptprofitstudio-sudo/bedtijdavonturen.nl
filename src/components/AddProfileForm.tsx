'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui'
import { AgeGroup, ChildProfile } from '@/lib/types'
import { createProfile, updateProfile } from '@/lib/firebase/db'
import { useAuth } from '@/context/AuthContext'

interface ProfileFormProps {
    onSuccess: () => void
    onCancel: () => void
    initialData?: ChildProfile
}

export function ProfileForm({ onSuccess, onCancel, initialData }: ProfileFormProps) {
    const { user } = useAuth()
    const [name, setName] = useState(initialData?.name || '')
    const [ageGroup, setAgeGroup] = useState<AgeGroup>(initialData?.ageGroup || '2-4')
    const [themePreference, setThemePreference] = useState<'fantasy' | 'adventure' | 'calm' | 'animals'>(initialData?.themePreference || 'fantasy')
    const [avatar, setAvatar] = useState(initialData?.avatar || '🐻')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const avatars = ['🐻', '🦊', '🦁', '🐰', '🚀', '👸', '🧙‍♂️', '🦖', '🦄', '🤖']
    const isEditing = !!initialData

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        if (!name.trim()) {
            setError('Vul een naam in')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            if (isEditing && initialData) {
                await updateProfile(user.uid, initialData.id, {
                    name,
                    ageGroup,
                    themePreference,
                    avatar
                })
            } else {
                await createProfile(user.uid, {
                    name,
                    ageGroup,
                    themePreference,
                    avatar
                })
            }
            onSuccess()
        } catch (err) {
            console.error('Failed to save profile', err)
            setError('Er ging iets mis. Probeer het opnieuw.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg border border-moon-100 shadow-sm">
            <div>
                <label className="block text-sm font-bold text-ink-700 mb-1">Naam</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border border-moon-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Naam van je kind"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-ink-700 mb-1">Leeftijd</label>
                <div className="flex gap-2">
                    {(['2-4', '4-7'] as AgeGroup[]).map((age) => (
                        <button
                            key={age}
                            type="button"
                            onClick={() => setAgeGroup(age)}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${ageGroup === age
                                ? 'bg-primary-500 text-white shadow-sm'
                                : 'bg-moon-50 text-ink-600 hover:bg-moon-100'
                                }`}
                        >
                            {age} jaar
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-ink-700 mb-1">Lievelings thema</label>
                <select
                    value={themePreference}
                    onChange={(e) => setThemePreference(e.target.value as any)}
                    className="w-full p-2 border border-moon-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                    <option value="fantasy">✨ Fantasie</option>
                    <option value="adventure">🗺️ Avontuur</option>
                    <option value="calm">🌙 Rustig</option>
                    <option value="animals">🐾 Dieren</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-bold text-ink-700 mb-2">Kies een avatar</label>
                <div className="flex flex-wrap gap-2">
                    {avatars.map((a) => (
                        <button
                            key={a}
                            type="button"
                            onClick={() => setAvatar(a)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-transform ${avatar === a
                                ? 'bg-primary-100 ring-2 ring-primary-500 scale-110'
                                : 'bg-moon-50 hover:bg-moon-100'
                                }`}
                        >
                            {a}
                        </button>
                    ))}
                </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
                    Annuleren
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? 'Bezig...' : (isEditing ? 'Opslaan' : 'Toevoegen')}
                </Button>
            </div>
        </form>
    )
}
