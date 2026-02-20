'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, SectionTitle, Pill } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { ProfileForm } from '@/components/AddProfileForm'
import { getProfiles, deleteProfile } from '@/lib/firebase/db'
import { ChildProfile } from '@/lib/types'
import { Avatar } from '@/components/avatars/AvatarSystem'
import { type AvatarType } from '@/lib/avatars'

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
                                            <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100">
                                                <Avatar type={(profile.avatar as AvatarType) || 'bear'} className="w-10 h-10" />
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
                                                <span className="material-symbols-outlined">edit</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="md"
                                                onClick={() => handleDelete(profile.id)}
                                                className="text-navy-300 hover:text-red-500 transition-colors"
                                                aria-label="Verwijder profiel"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
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
