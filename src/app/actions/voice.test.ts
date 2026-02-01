import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cloneVoiceAction } from './voice'

// Mock Dependencies
vi.mock('@/lib/firebase/admin', () => ({
    getAdminDb: vi.fn().mockResolvedValue({
        collection: () => ({
            doc: () => ({
                update: vi.fn().mockResolvedValue(true)
            })
        })
    })
}))

vi.mock('@/lib/secrets', () => ({
    getSecret: vi.fn().mockResolvedValue('fake-api-key')
}))

// Mock Next Cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}))

vi.mock('@/lib/server-analytics', () => ({
    trackServerEvent: vi.fn().mockResolvedValue(true)
}))

// Mock ElevenLabs SDK
const { mockAddVoice } = vi.hoisted(() => {
    return { mockAddVoice: vi.fn() }
})

vi.mock('elevenlabs', () => {
    return {
        ElevenLabsClient: class {
            voices = {
                add: mockAddVoice
            }
        }
    }
})

describe.skip('cloneVoiceAction', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should successfully clone a voice and update user profile', async () => {
        // Setup Success Response
        mockAddVoice.mockResolvedValue({ voice_id: 'new-voice-id-123' })

        // Create Mock FormData
        const formData = new FormData()
        formData.append('file', new Blob(['fake-audio'], { type: 'audio/mpeg' }))
        formData.append('userId', 'user-123')

        // Call Action
        const result = await cloneVoiceAction(formData)

        // Assertions
        if (!result.success) console.error('Voice Action Failed:', result.error)
        expect(result.success).toBe(true)
        expect(mockAddVoice).toHaveBeenCalled()
    })
})
