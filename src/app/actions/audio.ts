'use server'

import OpenAI from 'openai'
import { getSecret } from '@/lib/ai/generator'
import { getAdminDb } from '@/lib/firebase/admin'
import { uploadStoryAudio } from '@/lib/firebase/admin-storage'
import { revalidatePath } from 'next/cache'
import { Story } from '@/lib/types'

export async function generateAudioAction(storyId: string) {
    console.log('🎙️ Generating Audio for:', storyId)

    try {
        // 1. Fetch Story using Admin SDK (Secure Read)
        const db = await getAdminDb()
        const storyRef = db.collection('stories').doc(storyId)
        const storySnap = await storyRef.get()

        if (!storySnap.exists) throw new Error('Story not found')

        const data = storySnap.data()
        const story = { id: storySnap.id, ...data } as Story

        if (story.audioUrl) {
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

        // 2. Setup OpenAI
        const apiKey = await getSecret('OPENAI_API_KEY')
        if (!apiKey) throw new Error('Missing OpenAI Key')

        const openai = new OpenAI({ apiKey })

        // 3. Generate Speech
        const textToRead = `${story.title}. \n\n ${story.body.filter(b => b.type === 'p').map(b => b.text).join('\n\n')}`

        console.log('Sending text to OpenAI TTS...')
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: textToRead,
        })

        const buffer = Buffer.from(await mp3.arrayBuffer())

        // 4. Upload using Admin SDK (Secure Write)
        console.log('Uploading audio to Storage...')
        const audioUrl = await uploadStoryAudio(storyId, buffer)

        // 5. Update Firestore using Admin SDK (Secure Update)
        console.log('Updating story with audio URL...')
        await storyRef.update({ audioUrl })

        revalidatePath(`/listen/${storyId}`)
        return { success: true, audioUrl }

    } catch (error) {
        console.error('Audio generation failed:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { error: message }
    }
}
