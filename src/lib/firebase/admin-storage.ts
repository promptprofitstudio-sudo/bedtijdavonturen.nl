import { getAdminApp } from '@/lib/firebase/admin'
import { getStorage } from 'firebase-admin/storage'

export async function uploadStoryAudio(storyId: string, buffer: Buffer): Promise<string> {
    const app = await getAdminApp()
    const bucket = getStorage(app).bucket()
    const file = bucket.file(`audio/${storyId}.mp3`)

    await file.save(buffer, {
        metadata: {
            contentType: 'audio/mpeg',
        },
    })

    await file.makePublic()
    return file.publicUrl()
}
