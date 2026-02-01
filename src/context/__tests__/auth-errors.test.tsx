import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAuth, AuthProvider } from '../AuthContext'
import * as getClientConfig from '@/app/actions/get-client-config'

// Mock Firebase modules
vi.mock('firebase/auth', () => ({
    GoogleAuthProvider: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn((auth, callback) => {
        // Immediately call with null user (not logged in)
        callback(null)
        return vi.fn() // unsubscribe
    }),
    setPersistence: vi.fn().mockResolvedValue(undefined),
    browserLocalPersistence: { type: 'LOCAL' },
    getRedirectResult: vi.fn().mockResolvedValue(null),
}))

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    collection: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    Timestamp: { now: () => ({ seconds: Date.now() / 1000 }) },
}))

vi.mock('@/lib/firebase', () => ({
    initializeFirebaseServices: vi.fn(() => ({
        auth: { currentUser: null },
        db: {},
    })),
}))

const mockConfig = {
    apiKey: 'test-api-key',
    authDomain: 'bedtijdavonturen-prod.firebaseapp.com',
    projectId: 'bedtijdavonturen-prod',
    storageBucket: 'bedtijdavonturen-prod.firebasestorage.app',
    messagingSenderId: '340393072153',
    appId: '1:340393072153:web:test',
}

describe('AuthContext Error Handling', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(getClientConfig, 'getFirebaseClientConfig').mockResolvedValue(mockConfig)
    })

    it('exposes initError when config fails', async () => {
        const error = new Error('Network timeout')
        vi.spyOn(getClientConfig, 'getFirebaseClientConfig').mockRejectedValue(error)

        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
        })

        await waitFor(() => {
            expect(result.current.initError).toBe('Network timeout')
            expect(result.current.loading).toBe(false)
        })
    })

    it('sets loading to false after init error', async () => {
        vi.spyOn(getClientConfig, 'getFirebaseClientConfig').mockRejectedValue(
            new Error('Config load failed')
        )

        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
        })

        await waitFor(() => {
            expect(result.current.loading).toBe(false)
            expect(result.current.user).toBeNull()
        })
    })

    it('provides retryInit function to retry initialization', async () => {
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
        })

        await waitFor(() => {
            expect(result.current.retryInit).toBeDefined()
            expect(typeof result.current.retryInit).toBe('function')
        })
    })

    it('clears initError on successful retry', async () => {
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
        })

        // First attempt fails
        vi.spyOn(getClientConfig, 'getFirebaseClientConfig')
            .mockRejectedValueOnce(new Error('Failed'))

        await waitFor(() => expect(result.current.initError).toBeTruthy())

        // Retry succeeds
        vi.spyOn(getClientConfig, 'getFirebaseClientConfig')
            .mockResolvedValueOnce(mockConfig)

        act(() => {
            if (result.current.retryInit) {
                result.current.retryInit()
            }
        })

        await waitFor(() => {
            expect(result.current.initError).toBeNull()
        })
    })

    it('does not expose user when init fails', async () => {
        vi.spyOn(getClientConfig, 'getFirebaseClientConfig').mockRejectedValue(
            new Error('Init failed')
        )

        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
        })

        await waitFor(() => {
            expect(result.current.user).toBeNull()
            expect(result.current.initError).toBeTruthy()
        })
    })
})
