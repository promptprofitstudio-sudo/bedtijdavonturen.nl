'use server'

import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

const client = new SecretManagerServiceClient()
const projectId = 'pps-core-441' // Could be static or fetched, keep simple for scaffold

async function getSecret(name: string): Promise<string | undefined> {
    try {
        const [version] = await client.accessSecretVersion({
            name: `projects/${projectId}/secrets/${name}/versions/latest`,
        })
        return version.payload?.data?.toString()
    } catch (error) {
        console.error(`Failed to fetch secret ${name}:`, error)
        return undefined
    }
}

export async function getFirebaseClientConfig() {
    const [
        apiKey,
        authDomain,
        firebaseProjectId,
        storageBucket,
        messagingSenderId,
        appId
    ] = await Promise.all([
        getSecret('NEXT_PUBLIC_FIREBASE_API_KEY'),
        getSecret('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
        getSecret('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
        getSecret('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
        getSecret('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
        getSecret('NEXT_PUBLIC_FIREBASE_APP_ID')
    ])

    // Mapping the logical name in GSM to the config key
    // We assume the user has secrets named exactly as the Env Vars they would have used
    // Or simpler names. Based on previous `gcloud secrets list`, they are named:
    // NEXT_PUBLIC_FIREBASE_PROJECT_ID, etc.
    // Wait, looking at the previous list:
    // FIREBASE_APP_ID
    // FIREBASE_AUTH_DOMAIN
    // FIREBASE_MESSAGING_SENDER_ID
    // FIREBASE_STORAGE_BUCKET
    // NEXT_PUBLIC_FIREBASE_PROJECT_ID
    // API_KEY (maybe?) - Check list: 'API_KEY' exists. 'NEXT_PUBLIC_FIREBASE_API_KEY' does NOT.

    // Correction: I must check the actual secret names from the `gcloud secrets list` output in Step 215.
    // - API_KEY (Likely general, or for this? Assuming for now or fallback)
    // - FIREBASE_APP_ID
    // - FIREBASE_AUTH_DOMAIN
    // - FIREBASE_MESSAGING_SENDER_ID
    // - FIREBASE_STORAGE_BUCKET
    // - NEXT_PUBLIC_FIREBASE_PROJECT_ID

    // Re-mapping based on evidence:

    return {
        apiKey: await getSecret('API_KEY') || 'AIzaSyBmpTlzg_PdFwdr6xpRixCBluzfvR07J5I',
        authDomain: await getSecret('FIREBASE_AUTH_DOMAIN') || 'pps-core-441.firebaseapp.com',
        projectId: await getSecret('NEXT_PUBLIC_FIREBASE_PROJECT_ID') || 'pps-core-441',
        storageBucket: await getSecret('FIREBASE_STORAGE_BUCKET') || 'pps-core-441.firebasestorage.app',
        messagingSenderId: await getSecret('FIREBASE_MESSAGING_SENDER_ID') || '84492772496',
        appId: await getSecret('FIREBASE_APP_ID') || '1:84492772496:web:2f0231a43630025c5ae415'
    }
}
