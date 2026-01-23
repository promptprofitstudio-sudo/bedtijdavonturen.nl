
import { describe, it, expect, vi } from 'vitest'
import { getUserStories } from './get-stories'

// Mock dependencies
vi.mock('@/lib/firebase/admin-db', () => ({
    getStory: vi.fn(),
    // We'll trust that admin-db works, but for this action we want to specifically test the action logic
    // However, since getUserStories will likely call a db function directly, 
    // maybe we should put the logic in `lib/firebase/db-queries.ts` or similar?
    // Standards say actions call logic. 
    // Let's assume the action calls a getAdminDb query.
}))

vi.mock('@/lib/firebase/admin', () => ({
    getAdminDb: vi.fn(async () => ({
        collection: () => ({
            where: () => ({
                orderBy: () => ({
                    get: async () => ({
                        docs: [
                            { id: 'story-1', data: () => ({ title: 'Test Story 1', createdAt: { toDate: () => new Date() } }) },
                            { id: 'story-2', data: () => ({ title: 'Test Story 2', createdAt: { toDate: () => new Date() } }) }
                        ]
                    })
                })
            })
        })
    }))
}))

describe('getUserStories Action', () => {
    it('fetches stories for a given user', async () => {
        const stories = await getUserStories('user-123')
        expect(stories).toBeDefined()
        expect(stories.length).toBe(2)
        expect(stories[0].title).toBe('Test Story 1')
    })
})
