'use server'

import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

const client = new SecretManagerServiceClient()
const projectId = 'bedtijdavonturen-prod' // Updated for production isolation

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
    // Retrieve sensitive keys from Secrets Manager
    // Public config (Project ID, App ID, etc.) is safe to hardcode here for this dedicated project.

    // API_KEY is theoretically sensitive but often exposed. We try to fetch or fallback.
    // const secretApiKey = await getSecret('API_KEY') 

    // The secret 'API_KEY' currently holds a non-AIza key (likely Service Account or other)
    const validApiKey = 'AIzaSyD_AuWiMYgDc-JXhwPJu3l_Ilo42a_DX0Q'

    return {
        apiKey: validApiKey,
        authDomain: 'bedtijdavonturen-prod.firebaseapp.com',
        projectId: 'bedtijdavonturen-prod',
        storageBucket: 'bedtijdavonturen-prod.firebasestorage.app',
        messagingSenderId: '340393072153',
        appId: '1:340393072153:web:a58f7ca8d5ac620c41fc88'
    }
}
