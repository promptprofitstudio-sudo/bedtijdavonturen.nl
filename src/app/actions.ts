'use server'

import { z } from 'zod'
import { generateStoryWithAI } from '@/lib/ai/generator'
// import { createStory } from '@/lib/firebase/db' // client sdk not used here anymore
import { StoryMood, StoryMoodSchema, AgeGroupSchema } from '@/lib/types'
import { redirect } from 'next/navigation'

// Input validation schema
const GenerateStoryInput = z.object({
    userId: z.string(),
    profileId: z.string(), // ID of the child
    childName: z.string(),
    ageGroup: AgeGroupSchema,
    mood: StoryMoodSchema,
    theme: z.string().min(3),
})

export async function generateStoryAction(formData: FormData) {
    // 1. Parse Input
    const rawData = {
        userId: formData.get('userId'),
        profileId: formData.get('profileId'),
        childName: formData.get('childName'),
        ageGroup: formData.get('ageGroup'),
        mood: formData.get('mood'),
        theme: formData.get('theme'),
    }

    const result = GenerateStoryInput.safeParse(rawData)

    if (!result.success) {
        return { error: 'Ongeldige invoer: ' + result.error.message }
    }

    const { userId, profileId, childName, ageGroup, mood, theme } = result.data

    try {
        // 2. Generate Story (AI)
        const generatedStory = await generateStoryWithAI(childName, ageGroup, mood as StoryMood, theme)

        // 3. Save to DB using Admin SDK (Server-side)
        const { getAdminDb } = await import('@/lib/firebase/admin')
        const adminDb = await getAdminDb()

        const newStory = {
            ...generatedStory,
            userId,
            profileId,
            childName,
            ageGroup: ageGroup,
            createdAt: new Date() // Admin SDK uses native Date or Timestamp
        }

        console.log('[Action] Attempting to write story to Firestore...', { storyId: null, userId })
        const docRef = await adminDb.collection('stories').add(newStory)
        console.log('[Action] Successfully wrote story:', docRef.id)

        // 4. Return Success
        return { success: true, storyId: docRef.id }
    } catch (error) {
        console.error('Story generation failed:', error)
        const message = error instanceof Error ? error.message : 'Onbekende fout'
        return { error: `Er ging iets mis: ${message}` }
    }
}
