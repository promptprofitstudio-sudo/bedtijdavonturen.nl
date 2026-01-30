'use server'

import { generateAudio } from "@/lib/ai/audio"
import { getAdminDb } from '@/lib/firebase/admin'
import { revalidatePath } from 'next/cache'
import { Story } from '@/lib/types'

export async function generateAudioAction(storyId: string, options?: { useCustomVoice?: boolean, force?: boolean }) {
    console.log('🎙️ Generating Audio for:', storyId, options)

    try {
        // 1. Fetch Story using Admin SDK (Secure Read)
        const db = await getAdminDb()
        const storyRef = db.collection('stories').doc(storyId)
        const storySnap = await storyRef.get()

        if (!storySnap.exists) throw new Error('Story not found')

        const data = storySnap.data()
        const story = { id: storySnap.id, ...data } as Story

        if (story.audioUrl && !options?.force) {
            console.log('Audio already exists, skipping generation.')
            return { success: true, audioUrl: story.audioUrl }
        }

        // --- TEST MODE MOCK ---
        if (process.env.TEST_MODE === 'true') {
            console.log('[Mock] Generating audio in TEST_MODE')
            const mockUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' // Public domain MP3 for testing
            await storyRef.update({ audioUrl: mockUrl })
            revalidatePath(`/listen/${storyId}`)
            return { success: true, audioUrl: mockUrl }
        }

        // 2b. Fetch User Profile for Custom Voice
        const userRef = db.collection('users').doc(story.userId)
        const userSnap = await userRef.get()
        const userData = userSnap.data()

        // Only use custom voice if available AND requested (default true if available)
        const shouldUseCustomVoice = options?.useCustomVoice !== false
        const customVoiceId = shouldUseCustomVoice ? userData?.customVoiceId : undefined

        console.log(`Audio Logic: HasCustomVoice=${!!userData?.customVoiceId}, Requested=${shouldUseCustomVoice}, Using=${customVoiceId}`)

        // 3. Generate Audio with ElevenLabs
        const textToRead = `${story.title}. \n\n ${story.body.filter(b => b.type === 'p').map(b => b.text).join('\n\n')}`

        const audioUrl = await generateAudio({
            text: textToRead,
            mood: story.mood,
            storyId: story.id,
            userId: story.userId,
            customVoiceId // [NEW] Pass custom voice
        })

        // 4. Update Firestore using Admin SDK (Secure Update)
        console.log('Updating story with audio URL...')
        await storyRef.update({ audioUrl })

        revalidatePath(`/listen/${storyId}`)

        // Capture Analytics
        try {
            const { PostHog } = await import('posthog-node')
            const { getSecret } = await import('@/lib/secrets')

            const phKey = await getSecret('NEXT_PUBLIC_POSTHOG_KEY')
            const phHost = (await getSecret('NEXT_PUBLIC_POSTHOG_HOST')) || 'https://app.posthog.com'

            if (!phKey) {
                console.warn('⚠️ PostHog Key not found, skipping analytics.')
            } else {
                const client = new PostHog(phKey, { host: phHost })

                client.capture({
                    distinctId: story.userId,
                    event: 'audio_generated',
                    properties: {
                        story_id: storyId,
                        mood: story.mood,
                        audio_url: audioUrl,
                        voice_type: customVoiceId ? 'cloned' : 'default'
                    }
                })
                await client.shutdown()
            }
        } catch (e) {
            console.error('Failed to capture analytics:', e)
        }

        return { success: true, audioUrl }

    } catch (error) {
        console.error('Audio generation failed:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { error: message }
    }
}
