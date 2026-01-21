import { getAdminDb } from './admin'
import { Story } from '@/lib/types'

export async function getStory(storyId: string): Promise<Story | null> {
    const db = await getAdminDb()
    const snap = await db.collection('stories').doc(storyId).get()
    if (!snap.exists) return null

    const data = snap.data()
    return {
        id: snap.id,
        ...data,
        createdAt: data?.createdAt?.toDate ? data.createdAt.toDate() : new Date()
    } as Story
}
