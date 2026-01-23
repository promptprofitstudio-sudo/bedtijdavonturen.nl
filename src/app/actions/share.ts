'use server'

import { getAdminDb } from '@/lib/firebase/admin'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'

export async function generateShareToken(storyId: string, userId: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
        const db = await getAdminDb()
        const storyRef = db.collection('stories').doc(storyId)
        const snap = await storyRef.get()

        if (!snap.exists) return { success: false, error: 'Story not found' }

        const data = snap.data()
        if (data?.userId !== userId) {
            return { success: false, error: 'Unauthorized: You do not own this story' }
        }

        // Return existing token if available
        if (data.shareToken) {
            return { success: true, token: data.shareToken }
        }

        // Generate new token
        const newToken = randomUUID()
        await storyRef.update({ shareToken: newToken })

        const { trackServerEvent } = await import('@/lib/server-analytics')
        await trackServerEvent({
            userId: data.userId, // use data.userId from doc to be safe, or arg userId
            event: 'share_link_created',
            properties: { story_id: storyId }
        })

        revalidatePath(`/listen/${storyId}`)
        return { success: true, token: newToken }

    } catch (error) {
        console.error("Share Token Error:", error)
        return { success: false, error: 'Failed to generate link' }
    }
}
