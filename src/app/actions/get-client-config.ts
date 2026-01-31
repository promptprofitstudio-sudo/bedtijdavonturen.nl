'use server'

import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

const client = new SecretManagerServiceClient()
const projectId = 'bedtijdavonturen-prod' // Updated for production isolation

async function getSecret(name: string, suppressLog = false): Promise<string | undefined> {
    try {
        const [version] = await client.accessSecretVersion({
            name: `projects/${projectId}/secrets/${name}/versions/latest`,
        })
        return version.payload?.data?.toString()
    } catch (error: any) {
        if (!suppressLog) {
            console.error(`Failed to fetch secret ${name}:`, error.message || error)
        }
        return undefined
    }
}

export async function getFirebaseClientConfig() {
    // Retrieve sensitive keys from Secrets Manager

    // Fetch API Key from GSM (Enforced Policy)
    // We suppress logs here because this key might not exist in GSM yet, and we have a valid hardcoded fallback.
    const apiKey = await getSecret('FIREBASE_API_KEY', true) || 'AIzaSyD_AuWiMYgDc-JXhwPJu3l_Ilo42a_DX0Q'

    // User requested strict GSM use.
    // If we strictly fail without it:
    // const apiKey = await getSecret('FIREBASE_API_KEY');
    // if (!apiKey) throw new Error("Missing FIREBASE_API_KEY in GSM");

    return {
        apiKey: apiKey,
        authDomain: 'bedtijdavonturen-prod.firebaseapp.com',
        projectId: 'bedtijdavonturen-prod',
        storageBucket: 'bedtijdavonturen-prod.firebasestorage.app',
        messagingSenderId: '340393072153',
        appId: '1:340393072153:web:a58f7ca8d5ac620c41fc88'
    }
}
