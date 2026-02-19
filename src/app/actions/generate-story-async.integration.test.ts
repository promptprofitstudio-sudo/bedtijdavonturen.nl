import { describe, it, expect, beforeEach, vi } from 'vitest'
import { generateStoryAction } from './actions'

// Mock Firebase Admin
vi.mock('@/lib/firebase/admin', () => ({
    getAdminDb: vi.fn(() => ({
        collection: vi.fn((name: string) => {
            if (name === 'users') {
                return {
                    doc: vi.fn(() => ({
                        get: vi.fn().mockResolvedValue({
                            data: vi.fn(() => ({
                                credits: 5,
                                subscriptionStatus: 'free'
                            }))
                        }),
                        update: vi.fn().mockResolvedValue(undefined)
                    }))
                }
            }
            if (name === 'stories') {
                return {
                    add: vi.fn().mockResolvedValue({
                        id: 'mock-story-id-123'
                    })
                }
            }
        })
    })),
    FIREBASE_PROJECT_ID: 'test-project'
}))

// Mock AI Generator
vi.mock('@/lib/ai/generator', () => ({
    generateStoryWithAI: vi.fn().mockResolvedValue({
        title: 'Test Story',
        content: 'Once upon a time...',
        audioUrl: null
    })
}))

// Mock analytics to track if it's called synchronously
const analyticsCallTimes: number[] = []
let analyticsWasAwaited = false

vi.mock('@/lib/analytics-async', () => ({
    trackServerEventAsync: vi.fn(() => {
        // Record when this was called
        analyticsCallTimes.push(Date.now())
        // This should NOT be awaited, so we shouldn't have a delay here
    }),
    flushAnalytics: vi.fn().mockResolvedValue(undefined),
    getQueueSize: vi.fn().mockReturnValue(1)
}))

describe('Story Generation with Async Analytics', () => {
    beforeEach(() => {
        analyticsCallTimes = []
        analyticsWasAwaited = false
        vi.clearAllMocks()
    })

    it('should generate story without waiting for analytics', async () => {
        const formData = new FormData()
        formData.append('userId', 'test-user-123')
        formData.append('profileId', 'test-profile-123')
        formData.append('childName', 'Emma')
        formData.append('ageGroup', '4-6')
        formData.append('mood', 'calm')
        formData.append('theme', 'animals')

        const startTime = Date.now()

        // This should complete quickly, not waiting for analytics
        const result = await generateStoryAction(formData)

        const duration = Date.now() - startTime

        // Story generation should complete in reasonable time
        // (not waiting for 300-500ms analytics call)
        expect(result.success).toBe(true)
        expect(result.storyId).toBe('mock-story-id-123')

        // Duration should be much less than 500ms
        // (in test environment, this will be very fast)
        expect(duration).toBeLessThan(1000)
    })

    it('should handle analytics failure without breaking story generation', async () => {
        // Mock analytics to throw error
        const { trackServerEventAsync } = require('@/lib/analytics-async')
        trackServerEventAsync.mockImplementation(() => {
            throw new Error('Analytics service down')
        })

        const formData = new FormData()
        formData.append('userId', 'test-user-123')
        formData.append('profileId', 'test-profile-123')
        formData.append('childName', 'Emma')
        formData.append('ageGroup', '4-6')
        formData.append('mood', 'calm')
        formData.append('theme', 'animals')

        // Should still succeed even if analytics fails
        const result = await generateStoryAction(formData)

        expect(result.success).toBe(true)
        expect(result.storyId).toBe('mock-story-id-123')
    })

    it('should queue analytics events (not synchronous)', async () => {
        const { trackServerEventAsync } = require('@/lib/analytics-async')

        const formData = new FormData()
        formData.append('userId', 'test-user-123')
        formData.append('profileId', 'test-profile-123')
        formData.append('childName', 'Emma')
        formData.append('ageGroup', '4-6')
        formData.append('mood', 'calm')
        formData.append('theme', 'animals')

        await generateStoryAction(formData)

        // Verify trackServerEventAsync was called (not trackServerEvent with await)
        expect(trackServerEventAsync).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'test-user-123',
                event: 'story_generated',
                properties: expect.objectContaining({
                    story_id: 'mock-story-id-123'
                })
            })
        )

        // The call was made, but not awaited
        expect(trackServerEventAsync).toHaveBeenCalledTimes(1)
    })

    it('should not block user-facing response on analytics', async () => {
        // Simulate a slow analytics service
        let analyticsStartTime = 0
        let analyticsEndTime = 0

        const { trackServerEventAsync } = require('@/lib/analytics-async')
        trackServerEventAsync.mockImplementation(async () => {
            analyticsStartTime = Date.now()
            // Simulate 300ms delay (old behavior)
            await new Promise(r => setTimeout(r, 300))
            analyticsEndTime = Date.now()
        })

        const formData = new FormData()
        formData.append('userId', 'test-user-123')
        formData.append('profileId', 'test-profile-123')
        formData.append('childName', 'Emma')
        formData.append('ageGroup', '4-6')
        formData.append('mood', 'calm')
        formData.append('theme', 'animals')

        const startTime = Date.now()
        const result = await generateStoryAction(formData)
        const duration = Date.now() - startTime

        // Even though we mocked analytics to take 300ms,
        // the story generation should NOT wait for it
        expect(result.success).toBe(true)

        // The response should come back quickly (not waiting for 300ms analytics)
        // In test environment with mocks, this will be <100ms
        expect(duration).toBeLessThan(300)
    })

    it('should include proper event properties', async () => {
        const { trackServerEventAsync } = require('@/lib/analytics-async')

        const formData = new FormData()
        formData.append('userId', 'test-user-456')
        formData.append('profileId', 'profile-abc')
        formData.append('childName', 'Oliver')
        formData.append('ageGroup', '6-9')
        formData.append('mood', 'adventurous')
        formData.append('theme', 'space exploration')

        await generateStoryAction(formData)

        expect(trackServerEventAsync).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'test-user-456',
                event: 'story_generated',
                properties: expect.objectContaining({
                    story_id: 'mock-story-id-123',
                    mood: 'adventurous',
                    age_group: '6-9',
                    has_theme: true,
                    child_name_length: 6 // 'Oliver' = 6 chars
                })
            })
        )
    })
})
