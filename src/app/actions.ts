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
        context: formData.get('context'),
    }


    const result = GenerateStoryInput.safeParse(rawData)

    if (!result.success) {
        console.error('Validation error:', result.error);
        return { error: 'Ongeldige invoer: ' + result.error.message }
    }

    const { userId, profileId, childName, ageGroup, mood, theme, context } = result.data

    try {
        // 2. Generate Story (AI)
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

        try {
            const { PostHog } = await import('posthog-node')
            const { getSecret } = await import('@/lib/secrets')

            const phKey = await getSecret('NEXT_PUBLIC_POSTHOG_KEY')
            const phHost = (await getSecret('NEXT_PUBLIC_POSTHOG_HOST')) || 'https://app.posthog.com'

            if (!phKey) {
                console.warn('⚠️ PostHog Key not found, skipping analytics.')
            } else {
                const client = new PostHog(phKey, { host: phHost })

                client.capture({
                    distinctId: userId,
                    event: 'story_generated',
                    properties: {
                        story_id: docRef.id,
                        mood: mood,
                        age_group: ageGroup,
                        has_theme: !!theme,
                        child_name_length: childName.length
                    }
                })
                await client.shutdown()
            }
        } catch (e) {
            console.error('Failed to capture analytics:', e)
        }

        // 4. Return Success
        // @ts-ignore
        const currentProject = adminDb.app?.options?.projectId || 'unknown'
        console.log(`[GenerateAction] Success. ID: ${docRef.id}, Project: ${currentProject}`)
        return { success: true, storyId: docRef.id, debugProject: currentProject }
    } catch (error) {
        console.error('Story generation failed:', error)
        const message = error instanceof Error ? error.message : 'Onbekende fout'
        return { error: `Er ging iets mis: ${message}` }
    }
}
