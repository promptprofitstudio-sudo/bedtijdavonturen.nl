'use server'

import { z } from 'zod'
import { generateStoryWithAI } from '@/lib/ai/generator'
import { createStory } from '@/lib/firebase/db'
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

        // 3. Save to DB
        const storyId = await createStory({
            ...generatedStory,
            userId,
            profileId,
            childName,
            ageGroup: ageGroup, // Explicitly cast if needed, though validated by Zod
            // The generator returns title, mood, minutes, excerpt, body
            // We explicitly map them to ensure type safety, though spread works if key names match
        })

        // 4. Return Success
        return { success: true, storyId }
    } catch (error) {
        console.error('Story generation failed:', error)
        return { error: 'Er ging iets mis met het maken van het verhaal.' }
    }
}
