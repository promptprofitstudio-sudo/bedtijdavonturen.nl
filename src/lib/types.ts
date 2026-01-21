import { z } from 'zod'
import { Timestamp } from 'firebase/firestore'

// --- Firestore Schemas ---

// User (Parent) Schema
export const UserSchema = z.object({
    uid: z.string(),
    email: z.string().email().nullable(), // Updated to allow null
    displayName: z.string().nullable(),
    photoURL: z.string().nullable().optional(), // Added photoURL
    subscriptionStatus: z.enum(['free', 'premium', 'trialing', 'canceled', 'past_due']), // Updated enum values
    stripeCustomerId: z.string().optional(), // Added Stripe customer ID
    subscriptionId: z.string().optional(), // Added Stripe subscription ID
    createdAt: z.custom<Timestamp>(),
})

export type UserData = z.infer<typeof UserSchema>

// Child Profile Schema
export const AgeGroupSchema = z.enum(['2-4', '4-7'])
export type AgeGroup = z.infer<typeof AgeGroupSchema>

export const ChildProfileSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Naam is verplicht'),
    ageGroup: AgeGroupSchema,
    themePreference: z.enum(['fantasy', 'adventure', 'calm', 'animals']),
    avatar: z.string().optional(),
    createdAt: z.custom<Timestamp>(),
})

export type ChildProfile = z.infer<typeof ChildProfileSchema>

// Story Schema
export const StoryMoodSchema = z.enum(['Rustig', 'Grappig', 'Dapper', 'Troost'])

export const StoryBodySchema = z.array(
    z.object({
        type: z.enum(['p', 'pause']),
        text: z.string()
    })
)

export const DialogicPromptSchema = z.object({
    pausePoint: z.number(), // Index of paragraph after which to show
    question: z.string(),
    context: z.string()
})

export const StorySchema = z.object({
    id: z.string(),
    childName: z.string(),
    title: z.string(),
    mood: StoryMoodSchema,
    ageGroup: AgeGroupSchema, // Added strict age group
    minutes: z.number(),
    excerpt: z.string(),
    body: StoryBodySchema,
    dialogicPrompts: z.array(DialogicPromptSchema), // Added mandatory prompts
    audioUrl: z.string().optional(),
    createdAt: z.custom<Timestamp>(),
    userId: z.string(),
    profileId: z.string(),
})

export type Story = z.infer<typeof StorySchema>
export type StoryMood = z.infer<typeof StoryMoodSchema>

// --- App State Interfaces ---


export interface AuthState {
    user: UserData | null
    loading: boolean
    error: Error | null
}
