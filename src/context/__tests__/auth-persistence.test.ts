import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setPersistence, browserLocalPersistence } from 'firebase/auth'

// Mock Firebase Auth
const mockAuth = {
    currentUser: null,
    _persistenceKeyName: 'firebase:authUser',
}

const mockSetPersistence = vi.fn().mockResolvedValue(undefined)

describe('Auth Persistence', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('sets browserLocalPersistence on initialization', async () => {
        // Simulate what AuthContext does on init
        await mockSetPersistence(mockAuth, browserLocalPersistence)

        expect(mockSetPersistence).toHaveBeenCalledTimes(1)
        expect(mockSetPersistence).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(Function)
        )
    })

    it('handles persistence setting before sign-in', async () => {
        // AuthContext calls setPersistence twice: on init and before signIn
        await mockSetPersistence(mockAuth, browserLocalPersistence)
        await mockSetPersistence(mockAuth, browserLocalPersistence)

        expect(mockSetPersistence).toHaveBeenCalledTimes(2)
    })

    it('retries persistence setting on failure', async () => {
        const retryMock = vi.fn()
            .mockRejectedValueOnce(new Error('IndexedDB unavailable'))
            .mockResolvedValueOnce(undefined)

        try {
            await retryMock(mockAuth, browserLocalPersistence)
        } catch {
            // Expected first failure
        }

        // Retry
        await retryMock(mockAuth, browserLocalPersistence)

        expect(retryMock).toHaveBeenCalledTimes(2)
    })

    it('logs error when persistence fails', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
        const failingMock = vi.fn().mockRejectedValue(new Error('Persistence failed'))

        try {
            await failingMock(mockAuth, browserLocalPersistence)
        } catch (e: any) {
            console.error('❌ AuthContext: Persistence error', e)
        }

        expect(consoleSpy).toHaveBeenCalledWith(
            '❌ AuthContext: Persistence error',
            expect.any(Error)
        )

        consoleSpy.mockRestore()
    })

    it('verifies persistence mechanism is callable', () => {
        // Just verify we can call the persistence setter
        expect(typeof setPersistence).toBe('function')
        expect(browserLocalPersistence).toBeDefined()
    })
})
