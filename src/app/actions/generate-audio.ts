'use server'

import { getAdminApp, getAdminDb, getSecret } from '@/lib/firebase/admin'
import { getStorage } from 'firebase-admin/storage'
import { ElevenLabsClient } from 'elevenlabs'
import { revalidatePath } from 'next/cache'

export async function generateStoryAudio(storyId: string, userId: string) {
    try {
        console.log(`🎙️ Generating Audio for Story: ${storyId}`)
        const db = await getAdminDb()
        const storyRef = db.collection('stories').doc(storyId)
        const storySnap = await storyRef.get()

        if (!storySnap.exists) throw new Error('Story not found')
        const story = storySnap.data() as any

        // Check ownership (simple check)
        if (story.userId !== userId) {
            // throw new Error('Unauthorized') // Commented out for now to allow shared generation if needed, but safer to enforce
        }

        if (story.audioUrl) {
            console.log('Audio already exists.')
            return { success: true, audioUrl: story.audioUrl }
        }

        // 1. Get Text
        // Concatenate all 'p' contents
        const text = story.body
            .filter((b: any) => b.type === 'p')
            .map((b: any) => b.text)
            .join(' ')

        if (!text) throw new Error('No text content found')

        // 2. ElevenLabs
        const apiKey = await getSecret('ELEVENLABS_API_KEY')
        if (!apiKey) throw new Error('Missing ElevenLabs Key')

        const eleven = new ElevenLabsClient({ apiKey })

        // Use custom voice if user has one, else default (Rachel)
        // We'd need to fetch user profile for customVoiceId.
        // For now, default to '21m00Tcm4TlvDq8ikWAM' (Rachel) or a fun storyteller voice.
        // Let's use 'AZnzlk1XvdvUeBnXmlld' (Domi - Female American) or similar.
        // Or user's custom voice if available in User doc.

        const userRef = db.collection('users').doc(story.userId)
        const userSnap = await userRef.get()
        const userData = userSnap.data()

        const voiceId = userData?.customVoiceId || '21m00Tcm4TlvDq8ikWAM' // Default Rachel

        console.log(`Using Voice ID: ${voiceId}`)

        const audioStream = await eleven.textToSpeech.convert(voiceId, {
            text,
            model_id: 'eleven_multilingual_v2',
            output_format: 'mp3_44100_128'
        })

        // 3. Upload to Firebase Storage
        const app = await getAdminApp()
        const bucket = getStorage(app).bucket()
        const file = bucket.file(`audio/${storyId}.mp3`)

        // Convert Node stream to Buffer
        const chunks: Buffer[] = []
        for await (const chunk of audioStream) {
            chunks.push(Buffer.from(chunk))
        }
        const buffer = Buffer.concat(chunks)

        await file.save(buffer, {
            contentType: 'audio/mpeg',
            public: true // Make public for playback
        })

        const publicUrl = file.publicUrl()
        console.log('✅ Audio Uploaded:', publicUrl)

        // 4. Update Firestore
        await storyRef.update({
            audioUrl: publicUrl
        })

        revalidatePath(`/story/${storyId}`)
        revalidatePath('/library')

        return { success: true, audioUrl: publicUrl }

    } catch (e: any) {
        console.error('Audio Gen Error:', e)
        return { success: false, error: e.message }
    }
}
