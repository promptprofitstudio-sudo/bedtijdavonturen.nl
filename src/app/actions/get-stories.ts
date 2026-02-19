'use server'

import { getAdminDb } from '@/lib/firebase/admin'
import { Story } from '@/lib/types'

export async function getUserStories(userId: string): Promise<Story[]> {
    if (!userId) return []

    // 1. Mock Data in Test Mode
    if (process.env.TEST_MODE === 'true') {
        const mockStore = (globalThis as any)._mockStories || {}
        return Object.values(mockStore).filter((s: any) => s.userId === userId) as Story[]
    }

    try {
        const db = await getAdminDb()
        const snapshot = await db.collection('stories')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get()

        if (snapshot.empty) {
            return []
        }

        return snapshot.docs.map(doc => {
            const data = doc.data()
            // Convert Firestore Timestamp to ISO string for JSON serialization
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
            return {
                id: doc.id,
                ...data,
                createdAt: createdAt.toISOString(),
            } as Story
        })
    } catch (error) {
        console.error('Failed to fetch user stories:', error)
        return []
    }
}
