import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getFirebaseClientConfig } from './get-client-config'

// Mock the Secret Manager client
vi.mock('@google-cloud/secret-manager', () => ({
    SecretManagerServiceClient: vi.fn().mockImplementation(() => ({
        accessSecretVersion: vi.fn().mockRejectedValue(new Error('GSM unavailable'))
    }))
}))

describe('getFirebaseClientConfig', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns valid config with all required fields', async () => {
        const config = await getFirebaseClientConfig()

        expect(config).toHaveProperty('apiKey')
        expect(config).toHaveProperty('authDomain')
        expect(config).toHaveProperty('projectId')
        expect(config).toHaveProperty('storageBucket')
        expect(config).toHaveProperty('messagingSenderId')
        expect(config).toHaveProperty('appId')

        expect(config.apiKey).toBeTruthy()
        expect(typeof config.apiKey).toBe('string')
    })

    it('returns hardcoded authDomain matching Firebase Console', async () => {
        const config = await getFirebaseClientConfig()

        // CRITICAL: Must match Firebase Console exactly
        expect(config.authDomain).toBe('bedtijdavonturen-prod.firebaseapp.com')
    })

    it('falls back to hardcoded config when GSM fails', async () => {
        const config = await getFirebaseClientConfig()

        // Should return the public fallback key
        expect(config.apiKey).toBe('AIzaSyD_AuWiMYgDc-JXhwPJu3l_Ilo42a_DX0Q')
        expect(config.projectId).toBe('bedtijdavonturen-prod')
    })

    it('does not throw error when secrets unavailable', async () => {
        await expect(getFirebaseClientConfig()).resolves.toBeDefined()
    })

    it('includes all Firebase required fields for initialization', async () => {
        const config = await getFirebaseClientConfig()

        const requiredFields = [
            'apiKey',
            'authDomain',
            'projectId',
            'storageBucket',
            'messagingSenderId',
            'appId'
        ]

        requiredFields.forEach(field => {
            expect(config).toHaveProperty(field)
            expect(config[field as keyof typeof config]).toBeTruthy()
        })
    })
})
