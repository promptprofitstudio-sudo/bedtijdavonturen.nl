import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

const ADMIN_APP_NAME = 'bedtijd-admin-v2'
const secretsClient = new SecretManagerServiceClient()

export async function getSecret(name: string): Promise<string | undefined> {
    try {
        console.log(`[Admin] Attempting to fetch secret: ${name}`)
        const projectId = 'bedtijdavonturen-prod'
        const [version] = await secretsClient.accessSecretVersion({
            name: `projects/${projectId}/secrets/${name}/versions/latest`,
        })
        const payload = version.payload?.data?.toString()
        if (payload) {
            console.log(`[Admin] Successfully fetched secret: ${name} (Length: ${payload.length})`)
        } else {
            console.warn(`[Admin] Secret ${name} fetched but payload is empty`)
        }
        return payload
    } catch (error: any) {
        console.error(`[Admin] FAILED to fetch secret ${name}:`, error)
        return undefined
    }
}

export async function getAdminApp(): Promise<App> {
    // Check if our specific named app is already initialized
    const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME)

    if (existingApp) {
        console.log(`[Admin] Reusing existing app: ${ADMIN_APP_NAME}`)
        return existingApp
    }

    console.log(`[Admin] Initializing new app: ${ADMIN_APP_NAME}...`)

    const projectId = 'bedtijdavonturen-prod'

    // In TEST_MODE (or local dev), skip secret fetch to avoid crashes if secret is missing
    let serviceAccountKey: string | undefined = undefined
    if (process.env.TEST_MODE !== 'true') {
        serviceAccountKey = await getSecret('FIREBASE_SERVICE_ACCOUNT_KEY')
    } else {
        console.log('[Admin] TEST_MODE detected. Skipping Service Account Key fetch, defaulting to ADC.')
    }

    const options: any = {
        // projectId, // Remove explicit projectId, let credential handle it if present
        storageBucket: `${projectId}.firebasestorage.app`
    }

    if (serviceAccountKey) {
        try {
            console.log('[Admin] Found explicit service account key! Attempting to parse...')
            const parsedKey = JSON.parse(serviceAccountKey)
            options.credential = cert(parsedKey)
            // Explicitly set projectId from key to be safe, but cert should handle it
            options.projectId = parsedKey.project_id
            console.log(`[Admin] Successfully created cert credential. Project: ${options.projectId}`)
        } catch (e) {
            console.error('[Admin] Failed to parse service account key, falling back to ADC', e)
            options.projectId = projectId // Fallback
        }
    } else {
        console.warn('[Admin] WARNING: No explicit key found in secrets! Falling back to Application Default Credentials (ADC).')
        options.projectId = projectId
    }

    return initializeApp(options, ADMIN_APP_NAME)
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
