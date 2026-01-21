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
    // Retrieve secrets possibly created by user or system
    const secretApiKey = await getSecret('API_KEY')
    const secretAuthDomain = await getSecret('FIREBASE_AUTH_DOMAIN')
    const secretProjectId = await getSecret('NEXT_PUBLIC_FIREBASE_PROJECT_ID')
    const secretStorageBucket = await getSecret('FIREBASE_STORAGE_BUCKET')
    const secretMessagingSenderId = await getSecret('FIREBASE_MESSAGING_SENDER_ID')
    const secretAppId = await getSecret('FIREBASE_APP_ID')

    // Valid Browser Key confirmed via `gcloud alpha services api-keys list`
    // The secret 'API_KEY' currently holds a non-AIza key (likely Service Account or other)
    const validApiKey = (secretApiKey && secretApiKey.startsWith('AIza'))
        ? secretApiKey
        : 'AIzaSyBmpTlzg_PdFwdr6xpRixCBluzfvR07J5I'

    return {
        apiKey: validApiKey,
        authDomain: secretAuthDomain || 'pps-core-441.firebaseapp.com',
        projectId: secretProjectId || 'pps-core-441',
        storageBucket: secretStorageBucket || 'pps-core-441.firebasestorage.app',
        messagingSenderId: secretMessagingSenderId || '84492772496',
        appId: secretAppId || '1:84492772496:web:2f0231a43630025c5ae415'
    }
}
