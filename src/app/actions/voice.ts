'use server'

import { getAdminDb } from '@/lib/firebase/admin'
import { getSecret } from '@/lib/secrets'
// import { ElevenLabsClient } from 'elevenlabs'

import { revalidatePath } from 'next/cache'
import { ElevenLabsClient } from 'elevenlabs'

export async function cloneVoiceAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        const file = formData.get('file') as File
        const userId = formData.get('userId') as string

        if (!file || !userId) {
            return { success: false, error: 'Missing file or user ID' }
        }

        // Validate File Size (Max 10MB)
        if (file.size > 10 * 1024 * 1024) throw new Error('File too large (Max 10MB)')

        if (process.env.TEST_MODE === 'true') {
            console.log('[Mock] Cloning Voice in TEST_MODE')
            // Simulate delay
            await new Promise(r => setTimeout(r, 500))
            const voiceId = "mock-voice-id-123"

            // Save to Firestore (Mock update)
            const db = await getAdminDb()
            await db.collection('users').doc(userId).update({
                customVoiceId: voiceId,
                isVoiceCloned: true
            })

            revalidatePath('/account')
            return { success: true }
        }

        const apiKey = await getSecret('ELEVENLABS_API_KEY')
        if (!apiKey) throw new Error('Missing API Key')

        const client = new ElevenLabsClient({ apiKey })

        console.log('🎙️ Cloning Voice for User:', userId)

        // Upload to ElevenLabs
        // Note: The SDK accepts File/Blob directly in Node 18+ environments
        const response = await client.voices.add({
            files: [file],
            name: `Parent Voice (${userId.slice(0, 5)})`,
            description: "User uploaded voice clone for bedtime stories"
        })

        const voiceId = response.voice_id
        console.log('✅ Voice Cloned! ID:', voiceId)

        // Save to Firestore
        // Save to Firestore
        const db = await getAdminDb()
        await db.collection('users').doc(userId).update({
            customVoiceId: voiceId,
            isVoiceCloned: true
        })

        // Track Event (async, non-blocking)
        const { trackServerEventAsync } = await import('@/lib/analytics-async')
        trackServerEventAsync({
            userId,
            event: 'voice_cloned',
            properties: { voice_id: voiceId }
        })
        // Don't await - fire-and-forget!

        revalidatePath('/account') // Update UI
        return { success: true }

    } catch (error) {
        console.error('Clone Voice Error:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}
