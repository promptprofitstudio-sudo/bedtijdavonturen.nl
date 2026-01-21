import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage'
import { initializeFirebaseServices } from '@/lib/firebase'
import { getFirebaseClientConfig } from '@/app/actions/get-client-config'

async function getStorageInstance(): Promise<FirebaseStorage> {
    const config = await getFirebaseClientConfig()
    if (!config.apiKey) throw new Error('Missing Firebase Config')
    const services = initializeFirebaseServices(config)
    return services.storage
}

export async function uploadStoryAudio(storyId: string, audioBuffer: Buffer): Promise<string> {
    const storage = await getStorageInstance()
    const storageRef = ref(storage, `stories/${storyId}/audio.mp3`)

    // Convert Buffer to Uint8Array/ArrayBuffer for Firebase SDK
    const uint8Array = new Uint8Array(audioBuffer)

    await uploadBytes(storageRef, uint8Array, {
        contentType: 'audio/mpeg',
        customMetadata: { storyId }
    })

    return await getDownloadURL(storageRef)
}
