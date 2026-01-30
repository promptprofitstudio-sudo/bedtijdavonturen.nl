
import { getStory } from '@/lib/firebase/admin-db'
import { getAdminDb } from '@/lib/firebase/admin'
import { GenerateAudioButton } from '@/components/GenerateAudioButton'
import { Button } from '@/components/ui'

export default async function GenerateAudioPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const story = await getStory(id)

    if (!story) {
        return <div className="p-8 text-center text-white">Verhaal niet gevonden.</div>
    }

    // Fetch User to check for voice clone
    const db = await getAdminDb()
    const userDoc = await db.collection('users').doc(story.userId).get()
    const userData = userDoc.data()
    const hasClonedVoice = !!userData?.customVoiceId

    if (story.audioUrl) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-navy-950 text-white p-6 space-y-6">
                <h1 className="text-2xl font-bold">Audio Bestaat Al! 🎧</h1>
                <p>Je hebt dit verhaal al ingesproken (of gegenereerd).</p>
                <a href={`/story/${id}?mode=audio`} className="bg-teal-500 px-6 py-3 rounded-xl font-bold hover:bg-teal-400 transition-colors">
                    Naar de Speler
                </a>

                <div className="mt-8 pt-8 border-t border-navy-800 w-full max-w-md">
                    <p className="text-sm text-navy-400 mb-4 text-center">Wil je een andere stem proberen?</p>
                    <GenerateAudioButton storyId={id} userId={story.userId} hasClonedVoice={hasClonedVoice} />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-navy-950 text-navy-50 flex flex-col items-center pt-20 px-6 space-y-8">
            <header className="text-center space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">Luisterversie Maken 🎙️</h1>
                <p className="text-navy-300">Maak van <b>{story.title}</b> een luisterboek.</p>
            </header>

            <div className="bg-navy-900 border border-navy-800 p-6 rounded-3xl max-w-md w-full text-center space-y-6 shadow-xl">
                <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-4xl">🗣️</span>
                </div>

                <div className="space-y-4">
                    <p className="text-lg font-medium text-white">Klaar om te genereren?</p>
                    <p className="text-sm text-navy-400">
                        Dit gebruikt 1 Credit van je bundel. We gebruiken je gekloonde stem (indien beschikbaar) of onze verteller.
                    </p>
                </div>

                <GenerateAudioButton storyId={id} userId={story.userId} hasClonedVoice={hasClonedVoice} />

                <a href={`/story/${id}`} className="block text-sm text-navy-500 hover:text-white underline mt-4">
                    Nee, ik wil alleen lezen
                </a>
            </div>
        </div>
    )
}
