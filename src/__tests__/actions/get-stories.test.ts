import { getUserStories } from '@/app/actions/get-stories'
import { Story } from '@/lib/types'
import { Timestamp } from 'firebase/firestore'

// Mock firebase admin
jest.mock('@/lib/firebase/admin', () => ({
    getAdminDb: jest.fn(),
}))

import { getAdminDb } from '@/lib/firebase/admin'

const mockGetAdminDb = getAdminDb as jest.MockedFunction<typeof getAdminDb>

describe('getUserStories', () => {
    afterEach(() => {
        jest.clearAllMocks()
        delete (globalThis as any)._mockStories
    })

    describe('Date serialization', () => {
        it('should return ISO string dates, not Date objects', async () => {
            // Mock Firestore response with Timestamp
            const mockTimestamp = Timestamp.fromDate(new Date('2026-02-19T10:00:00Z'))
            const mockSnapshot = {
                empty: false,
                docs: [
                    {
                        id: 'story1',
                        data: () => ({
                            childName: 'Emma',
                            title: 'The Magic Forest',
                            mood: 'Rustig',
                            ageGroup: '4-7',
                            minutes: 12,
                            excerpt: 'A story about...',
                            body: [{ type: 'p', text: 'Once upon a time...' }],
                            dialogicPrompts: [],
                            userId: 'user123',
                            profileId: 'profile1',
                            createdAt: mockTimestamp,
                        }),
                    },
                ],
            }

            mockGetAdminDb.mockResolvedValueOnce({
                collection: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        orderBy: jest.fn().mockReturnValue({
                            get: jest.fn().mockResolvedValueOnce(mockSnapshot),
                        }),
                    }),
                }),
            } as any)

            const stories = await getUserStories('user123')

            expect(stories).toHaveLength(1)
            expect(stories[0].createdAt).toBe('2026-02-19T10:00:00.000Z')
            // Verify it's a string, not a Date object
            expect(typeof stories[0].createdAt).toBe('string')
        })

        it('should handle already-converted ISO strings from mock data', async () => {
            // Mock Firestore response with ISO string (edge case)
            const isoString = '2026-02-19T10:00:00.000Z'
            const mockSnapshot = {
                empty: false,
                docs: [
                    {
                        id: 'story1',
                        data: () => ({
                            childName: 'Emma',
                            title: 'The Magic Forest',
                            mood: 'Rustig',
                            ageGroup: '4-7',
                            minutes: 12,
                            excerpt: 'A story about...',
                            body: [{ type: 'p', text: 'Once upon a time...' }],
                            dialogicPrompts: [],
                            userId: 'user123',
                            profileId: 'profile1',
                            createdAt: isoString, // Already a string
                        }),
                    },
                ],
            }

            mockGetAdminDb.mockResolvedValueOnce({
                collection: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        orderBy: jest.fn().mockReturnValue({
                            get: jest.fn().mockResolvedValueOnce(mockSnapshot),
                        }),
                    }),
                }),
            } as any)

            const stories = await getUserStories('user123')

            expect(stories).toHaveLength(1)
            expect(typeof stories[0].createdAt).toBe('string')
        })

        it('should return JSON-serializable data (no Date objects)', async () => {
            const mockTimestamp = Timestamp.fromDate(new Date('2026-02-19T10:00:00Z'))
            const mockSnapshot = {
                empty: false,
                docs: [
                    {
                        id: 'story1',
                        data: () => ({
                            childName: 'Emma',
                            title: 'The Magic Forest',
                            mood: 'Rustig',
                            ageGroup: '4-7',
                            minutes: 12,
                            excerpt: 'A story about...',
                            body: [{ type: 'p', text: 'Once upon a time...' }],
                            dialogicPrompts: [],
                            userId: 'user123',
                            profileId: 'profile1',
                            createdAt: mockTimestamp,
                        }),
                    },
                ],
            }

            mockGetAdminDb.mockResolvedValueOnce({
                collection: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        orderBy: jest.fn().mockReturnValue({
                            get: jest.fn().mockResolvedValueOnce(mockSnapshot),
                        }),
                    }),
                }),
            } as any)

            const stories = await getUserStories('user123')

            // Should be JSON serializable (no error)
            expect(() => JSON.stringify(stories)).not.toThrow()

            // Verify the JSON round-trip
            const jsonStr = JSON.stringify(stories)
            const parsed = JSON.parse(jsonStr)
            expect(parsed[0].createdAt).toBe('2026-02-19T10:00:00.000Z')
        })
    })

    describe('Mock data in TEST_MODE', () => {
        beforeEach(() => {
            process.env.TEST_MODE = 'true'
        })

        afterEach(() => {
            delete process.env.TEST_MODE
        })

        it('should use mock data when TEST_MODE is enabled', async () => {
            const mockStories = {
                story1: {
                    id: 'story1',
                    childName: 'Emma',
                    title: 'Test Story',
                    mood: 'Rustig' as const,
                    ageGroup: '4-7' as const,
                    minutes: 10,
                    excerpt: 'Test excerpt',
                    body: [{ type: 'p' as const, text: 'Test body' }],
                    dialogicPrompts: [],
                    userId: 'user123',
                    profileId: 'profile1',
                    createdAt: '2026-02-19T10:00:00.000Z',
                },
            }
            ;(globalThis as any)._mockStories = mockStories

            const stories = await getUserStories('user123')

            expect(stories).toHaveLength(1)
            expect(stories[0].id).toBe('story1')
        })

        it('should filter mock stories by userId', async () => {
            const mockStories = {
                story1: { ...{ userId: 'user123' } },
                story2: { ...{ userId: 'user456' } },
            }
            ;(globalThis as any)._mockStories = mockStories

            const stories = await getUserStories('user123')

            expect(stories).toHaveLength(1)
        })
    })

    describe('Error handling', () => {
        it('should return empty array on Firestore error', async () => {
            mockGetAdminDb.mockResolvedValueOnce({
                collection: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        orderBy: jest.fn().mockReturnValue({
                            get: jest.fn().mockRejectedValueOnce(new Error('Firestore error')),
                        }),
                    }),
                }),
            } as any)

            const stories = await getUserStories('user123')

            expect(stories).toEqual([])
        })

        it('should return empty array for missing userId', async () => {
            const stories = await getUserStories('')

            expect(stories).toEqual([])
        })

        it('should return empty array when no stories found', async () => {
            const mockSnapshot = { empty: true }

            mockGetAdminDb.mockResolvedValueOnce({
                collection: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        orderBy: jest.fn().mockReturnValue({
                            get: jest.fn().mockResolvedValueOnce(mockSnapshot),
                        }),
                    }),
                }),
            } as any)

            const stories = await getUserStories('user123')

            expect(stories).toEqual([])
        })
    })

    describe('Query ordering', () => {
        it('should order stories by createdAt descending', async () => {
            const timestamp1 = Timestamp.fromDate(new Date('2026-02-19T10:00:00Z'))
            const timestamp2 = Timestamp.fromDate(new Date('2026-02-18T10:00:00Z'))

            const mockSnapshot = {
                empty: false,
                docs: [
                    {
                        id: 'story1',
                        data: () => ({
                            childName: 'Emma',
                            title: 'Newer Story',
                            mood: 'Rustig',
                            ageGroup: '4-7',
                            minutes: 12,
                            excerpt: 'New',
                            body: [{ type: 'p', text: 'New' }],
                            dialogicPrompts: [],
                            userId: 'user123',
                            profileId: 'profile1',
                            createdAt: timestamp1,
                        }),
                    },
                    {
                        id: 'story2',
                        data: () => ({
                            childName: 'Emma',
                            title: 'Older Story',
                            mood: 'Rustig',
                            ageGroup: '4-7',
                            minutes: 12,
                            excerpt: 'Old',
                            body: [{ type: 'p', text: 'Old' }],
                            dialogicPrompts: [],
                            userId: 'user123',
                            profileId: 'profile1',
                            createdAt: timestamp2,
                        }),
                    },
                ],
            }

            mockGetAdminDb.mockResolvedValueOnce({
                collection: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        orderBy: jest.fn().mockReturnValue({
                            get: jest.fn().mockResolvedValueOnce(mockSnapshot),
                        }),
                    }),
                }),
            } as any)

            const stories = await getUserStories('user123')

            expect(stories).toHaveLength(2)
            expect(stories[0].title).toBe('Newer Story')
            expect(stories[1].title).toBe('Older Story')
        })
    })
})
