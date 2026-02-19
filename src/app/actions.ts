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
    context: z.string().optional(),
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
        context: formData.get('context') || undefined,
    }


    const result = GenerateStoryInput.safeParse(rawData)

    if (!result.success) {
        console.error('Validation error:', result.error);
        return { error: 'Ongeldige invoer: ' + result.error.message }
    }

    const { userId, profileId, childName, ageGroup, mood, theme, context } = result.data

    try {
        // 2. Check User Credits (Admin SDK)
        if (process.env.TEST_MODE !== 'true') {
            const { getAdminDb } = await import('@/lib/firebase/admin')
            const adminDb = await getAdminDb()

            const userRef = adminDb.collection('users').doc(userId)
            const userSnap = await userRef.get()
            const userData = userSnap.data() as { credits?: number, subscriptionStatus?: string } | undefined

            const isPremium = userData?.subscriptionStatus === 'premium' || userData?.subscriptionStatus === 'trial' || userData?.subscriptionStatus === 'admin'
            const credits = userData?.credits ?? 0

            console.log(`[GenerateStory] Credits Check: Credits=${credits}, IsPremium=${isPremium}`)

            if (!isPremium && credits <= 0) {
                return { error: 'Geen credits meer. Koop een bundel om verder te gaan.' }
            }
        }

        // 3. Generate Story (AI)
        const generatedStory = await generateStoryWithAI(childName, ageGroup, mood as StoryMood, theme, context)

        const newStory = {
            ...generatedStory,
            userId,
            profileId,
            childName,
            ageGroup: ageGroup,
            createdAt: new Date()
        }

        // 3. Save to DB using Admin SDK (Server-side)
        if (process.env.TEST_MODE === 'true') {
            const mockId = `mock-${Date.now()}`


            // Persist to global mock store
            if (!(globalThis as any)._mockStories) {
                (globalThis as any)._mockStories = {}
            }
            // eslint-disable-next-line security/detect-object-injection
            (globalThis as any)._mockStories[mockId] = { id: mockId, ...newStory }

            return { success: true, storyId: mockId }
        }

        const { getAdminDb } = await import('@/lib/firebase/admin')
        const adminDb = await getAdminDb()



        const docRef = await adminDb.collection('stories').add(newStory)

        // 4. Deduct Credit (Only if NOT premium)
        const userRef = adminDb.collection('users').doc(userId)
        const userSnap = await userRef.get()
        const userData = userSnap.data() as { subscriptionStatus?: string } | undefined
        const isPremium = userData?.subscriptionStatus === 'premium' || userData?.subscriptionStatus === 'trial' || userData?.subscriptionStatus === 'admin'

        if (!isPremium) {
            const { FieldValue } = await import('firebase-admin/firestore')
            await userRef.update({
                credits: FieldValue.increment(-1)
            })
            console.log(`[GenerateStory] Deducted 1 credit from user ${userId}`)
        }

        // 5. Analytics (async, non-blocking)
        try {
            const { trackServerEventAsync } = await import('@/lib/analytics-async')

            trackServerEventAsync({
                userId,
                event: 'story_generated',
                properties: {
                    story_id: docRef.id,
                    mood: mood,
                    age_group: ageGroup,
                    has_theme: !!theme,
                    child_name_length: childName.length
                }
            })
            // Don't await - this is fire-and-forget!
        } catch (e) {
            console.error('Failed to queue analytics:', e)
        }

        // 6. Return Success
        const { FIREBASE_PROJECT_ID } = await import('@/lib/firebase/admin')
        console.log(`[GenerateAction] Success. ID: ${docRef.id}, Project: ${FIREBASE_PROJECT_ID}`)
        return { success: true, storyId: docRef.id, debugProject: FIREBASE_PROJECT_ID }
    } catch (error) {
        console.error('Story generation failed:', error)
        const message = error instanceof Error ? error.message : 'Onbekende fout'
        return { error: `Er ging iets mis: ${message}` }
    }
}
