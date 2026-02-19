import { initializeApp, getApps, App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const ADMIN_APP_NAME = 'bedtijd-admin-v2'

/**
 * Firebase project ID - exported as constant to ensure consistency across the app
 * This should match the FIREBASE_PROJECT_ID env var in production, but we hardcode
 * it here as a fallback since ADC handles authentication automatically.
 */
export const FIREBASE_PROJECT_ID = 'bedtijdavonturen-prod'

/**
 * Get or initialize Firebase Admin app using Application Default Credentials (ADC)
 * 
 * In production (Cloud Run), the service account is automatically available via ADC.
 * In local development, use GOOGLE_APPLICATION_CREDENTIALS env var or gcloud auth.
 * 
 * No need for Secret Manager - the Cloud Run service account has direct Firestore access.
 */
export async function getAdminApp(): Promise<App> {
    // Check if our specific named app is already initialized
    const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME)

    if (existingApp) {
        console.log(`[Admin] ✓ Reusing existing app: ${ADMIN_APP_NAME}`)
        return existingApp
    }

    console.log(`[Admin] Initializing app: ${ADMIN_APP_NAME} with ADC...`)

    const projectId = FIREBASE_PROJECT_ID

    // Simple configuration - let ADC handle authentication
    const options = {
        projectId,
        storageBucket: `${projectId}.firebasestorage.app`
    }

    const app = initializeApp(options, ADMIN_APP_NAME)
    console.log(`[Admin] ✓ Initialized with project: ${FIREBASE_PROJECT_ID} (using ADC)`)

    return app
}

export async function getAdminDb() {
    const app = await getAdminApp()
    return getFirestore(app)
}

import { getAuth } from 'firebase-admin/auth'
export async function getAdminAuth() {
    const app = await getAdminApp()
    return getAuth(app)
}
// Force rebuild - Secret updated Sun Feb  1 20:06:04 CET 2026
