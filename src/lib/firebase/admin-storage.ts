import { getAdminApp } from '@/lib/firebase/admin'
import { getStorage } from 'firebase-admin/storage'

export async function uploadStoryAudio(storyId: string, buffer: Buffer, userId: string): Promise<string> {
    const app = await getAdminApp()
    const bucket = getStorage(app).bucket()
    const file = bucket.file(`stories/${storyId}/audio.mp3`) // Adjusted path to match rules if needed, or keep audio/

    // Use consistent path: client uses stories/{storyId}/audio.mp3? 
    // storage.ts used: ref(storage, `stories/${storyId}/audio.mp3`)
    // admin-storage.ts used: bucket.file(`audio/${storyId}.mp3`) -> inconsistent!
    // I will align to `stories/${storyId}/audio.mp3` to match storage.rules

    await file.save(buffer, {
        metadata: {
            contentType: 'audio/mpeg',
            metadata: {
                userId,
                storyId
            }
        },
    })

    await file.makePublic()
    return file.publicUrl()
}
