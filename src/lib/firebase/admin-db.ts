import { getAdminDb } from './admin'
import { Story } from '@/lib/types'

export async function getStory(storyId: string): Promise<Story | null> {
    // eslint-disable-next-line security/detect-object-injection
    if (process.env.TEST_MODE === 'true' && (globalThis as any)._mockStories && (globalThis as any)._mockStories[storyId]) {
        // eslint-disable-next-line security/detect-object-injection
        return (globalThis as any)._mockStories[storyId] as Story
    }

    const db = await getAdminDb()
    console.log(`[AdminDB] Fetching story ${storyId} from stories collection`)
    const snap = await db.collection('stories').doc(storyId).get()
    console.log(`[AdminDB] Snap exist: ${snap.exists}`)
    if (!snap.exists) return null

    const data = snap.data()
    return {
        id: snap.id,
        ...data,
        createdAt: data?.createdAt?.toDate ? data.createdAt.toDate() : new Date()
    } as Story
}
