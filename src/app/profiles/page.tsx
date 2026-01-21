'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, SectionTitle, Pill } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { ProfileForm } from '@/components/AddProfileForm'
import { getProfiles, deleteProfile } from '@/lib/firebase/db'
import { ChildProfile } from '@/lib/types'

export default function ProfilesPage() {
    const { user, loading: authLoading, db } = useAuth()
    const router = useRouter()
    const [profiles, setProfiles] = useState<ChildProfile[]>([])
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingProfile, setEditingProfile] = useState<ChildProfile | null>(null)
    const [loadingProfiles, setLoadingProfiles] = useState(true)

    const fetchProfiles = React.useCallback(async () => {
        if (user && db) {
            try {
                setLoadingProfiles(true)
                const list = await getProfiles(user.uid)
                setProfiles(list)
            } catch (err) {
                console.error('Failed to fetch profiles', err)
            } finally {
                setLoadingProfiles(false)
            }
        }
    }, [user, db])

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/account') // Redirect to account/login if not authenticated
        } else if (user) {
            fetchProfiles()
        }
    }, [user, authLoading, db, router, fetchProfiles])

    const handleDelete = async (profileId: string) => {
        if (!user) return
        if (!confirm('Weet je zeker dat je dit profiel wilt verwijderen?')) return
        try {
            await deleteProfile(user.uid, profileId)
            fetchProfiles()
        } catch (err) {
            console.error('Failed to delete profile', err)
            alert('Kon profiel niet verwijderen.')
        }
    }

    const handleEdit = (profile: ChildProfile) => {
        setEditingProfile(profile)
        setShowAddForm(true)
    }

    const handleFormSuccess = () => {
        setShowAddForm(false)
        setEditingProfile(null)
        fetchProfiles()
    }

    const handleFormCancel = () => {
        setShowAddForm(false)
        setEditingProfile(null)
    }

    if (authLoading || (user && loadingProfiles && profiles.length === 0)) {
        return (
            <main className="px-5 py-6 space-y-6">
                <div className="flex justify-center pt-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
                </div>
            </main>
        )
    }

    if (!user) return null // Will redirect

    return (
        <main className="px-5 py-6 space-y-6 pb-24">
            <header className="space-y-4">
                <div className="flex items-center justify-between">
                    <SectionTitle title="Profielen" subtitle="Beheer je bedtijd helden." />
                    {!showAddForm && (
                        <Button variant="teal" size="md" onClick={() => setShowAddForm(true)} className="shadow-lg">
                            + Nieuw
                        </Button>
                    )}
                </div>
            </header>

            {showAddForm ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <Card className="border-teal-100 ring-4 ring-teal-50/50">
                        <ProfileForm
                            initialData={editingProfile || undefined}
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormCancel}
                        />
                    </Card>
                </div>
            ) : (
                <div className="space-y-4">
                    {profiles.length === 0 ? (
                        <Card className="text-center py-12 space-y-4 border-dashed border-2 border-moon-200 bg-moon-50/50">
                            <p className="text-navy-800/60 font-medium">Nog geen avonturiers toegevoegd.</p>
                            <Button variant="primary" onClick={() => setShowAddForm(true)}>
                                Maak eerste profiel
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {profiles.map(profile => (
                                <div key={profile.id} className="group relative overflow-hidden rounded-2xl bg-white border border-moon-100 shadow-sm hover:shadow-md transition-all">
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center text-2xl border border-teal-100">
                                                {profile.avatar || '👤'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-navy-900 text-lg">{profile.name}</h3>
                                                <div className="flex gap-2 mt-1">
                                                    <Pill variant="teal">{profile.ageGroup} jaar</Pill>
                                                    <Pill variant="amber">{profile.themePreference}</Pill>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="md"
                                                onClick={() => handleEdit(profile)}
                                                className="text-navy-300 hover:text-teal-600 transition-colors"
                                                aria-label="Bewerk profiel"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                </svg>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="md"
                                                onClick={() => handleDelete(profile.id)}
                                                className="text-navy-300 hover:text-red-500 transition-colors"
                                                aria-label="Verwijder profiel"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                </svg>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </main>
    )
}
