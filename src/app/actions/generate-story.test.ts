
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateStoryAction } from '@/app/actions'

// Mock Dependencies
vi.mock('@/lib/ai/generator', () => ({
    generateStoryWithAI: vi.fn(async (name, age, mood, theme) => ({
        title: `Avontuur van ${name}`,
        mood,
        minutes: 5,
        excerpt: `Een testverhaal over ${theme}.`,
        body: [
            { type: 'p', text: `Testalinea voor ${name} en het thema ${theme}.` }
        ],
        dialogicPrompts: []
    }))
}))

const mockAdd = vi.fn().mockResolvedValue({ id: 'new-story-id' })

vi.mock('posthog-node', () => ({
    PostHog: class {
        capture() { }
        shutdown() { return Promise.resolve() }
    }
}))

vi.mock('@/lib/firebase/admin', () => ({
    getAdminDb: vi.fn(async () => ({
        collection: (name: string) => {
            if (name === 'stories') {
                return { add: mockAdd }
            }
            return {}
        },
        app: {
            options: { projectId: 'test-project' }
        }
    }))
}))

// Mock Secrets to avoid import errors if not clean
vi.mock('@/lib/secrets', () => ({
    getSecret: vi.fn().mockResolvedValue('fake-key')
}))

describe('generateStoryAction', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('validates input and generates a story', async () => {
        const formData = new FormData()
        formData.append('userId', 'user-123')
        formData.append('profileId', 'profile-abc')
        formData.append('childName', 'Jantje')
        formData.append('ageGroup', '4-7')
        formData.append('mood', 'Dapper')
        formData.append('theme', 'De vliegende auto')

        const result = await generateStoryAction(formData)

        expect(result.success).toBe(true)
        expect(result.storyId).toBe('new-story-id')
        expect(mockAdd).toHaveBeenCalledTimes(1)

        // precise verification of storage
        const storedData = mockAdd.mock.calls[0][0]
        expect(storedData.childName).toBe('Jantje')
        expect(storedData.userId).toBe('user-123')
        expect(storedData.excerpt).toContain('vliegende auto')
    })

    it('rejects invalid age group', async () => {
        const formData = new FormData()
        formData.append('userId', 'user-123')
        formData.append('profileId', 'profile-abc')
        formData.append('childName', 'Jantje')
        formData.append('ageGroup', '18-99') // Invalid
        formData.append('mood', 'Avontuurlijk')
        formData.append('theme', 'Test')

        const result = await generateStoryAction(formData)

        expect(result.success).toBeUndefined()
        expect(result.error).toBeDefined()
        expect(mockAdd).not.toHaveBeenCalled()
    })

    it('rejects missing theme', async () => {
        const formData = new FormData()
        formData.append('userId', 'user-123')
        formData.append('profileId', 'profile-abc')
        formData.append('childName', 'Jantje')
        formData.append('ageGroup', '4-7')
        formData.append('mood', 'Avontuurlijk')
        // Missing Theme

        const result = await generateStoryAction(formData)

        expect(result.error).toBeDefined()
    })
})
