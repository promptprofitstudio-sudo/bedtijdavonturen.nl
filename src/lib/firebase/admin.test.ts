import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getAdminApp, getAdminDb, FIREBASE_PROJECT_ID } from '@/lib/firebase/admin'

// Mock the Firebase Admin SDK
vi.mock('firebase-admin/app', () => {
    const mockApp = {
        name: 'test-app',
        options: {
            projectId: 'bedtijdavonturen-prod',
            storageBucket: 'bedtijdavonturen-prod.firebasestorage.app'
        }
    }
    
    return {
        initializeApp: vi.fn(() => mockApp),
        getApps: vi.fn(() => [])
    }
})

vi.mock('firebase-admin/firestore', () => {
    const mockFirestore = {
        app: {
            options: {
                projectId: 'bedtijdavonturen-prod'
            }
        }
    }
    
    return {
        getFirestore: vi.fn(() => mockFirestore)
    }
})

describe('Firebase Admin SDK', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('exports FIREBASE_PROJECT_ID constant', () => {
        expect(FIREBASE_PROJECT_ID).toBe('bedtijdavonturen-prod')
    })

    it('initializes app with correct project ID', async () => {
        const app = await getAdminApp()
        expect(app.options.projectId).toBe('bedtijdavonturen-prod')
    })

    it('getAdminDb returns firestore with app reference', async () => {
        const db = await getAdminDb()
        // The key test: can we access projectId?
        const projectId = db.app?.options?.projectId
        expect(projectId).toBe('bedtijdavonturen-prod')
    })
})
