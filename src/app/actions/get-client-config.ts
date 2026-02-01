'use server'

import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

// Lazy initialization to prevent top-level crashes
let client: SecretManagerServiceClient | null = null

function getClient() {
    if (!client) {
        client = new SecretManagerServiceClient()
    }
    return client
}

const projectId = 'bedtijdavonturen-prod'

async function getSecret(name: string, suppressLog = false): Promise<string | undefined> {
    try {
        const secretClient = getClient()
        const [version] = await secretClient.accessSecretVersion({
            name: `projects/${projectId}/secrets/${name}/versions/latest`,
        })
        return version.payload?.data?.toString()
    } catch (error: any) {
        // Fallback or Log
        if (!suppressLog) {
            console.error(`Failed to fetch secret ${name}:`, error.message || error)
        }
        return undefined
    }
}

export async function getFirebaseClientConfig() {
    try {
        // Attempt to fetch API Key from GSM
        // We catch errors here to ensure the hardcoded fallback is ALWAYS returned if GSM fails.
        const apiKey = await getSecret('FIREBASE_API_KEY', true)

        return {
            apiKey: apiKey || 'AIzaSyD_AuWiMYgDc-JXhwPJu3l_Ilo42a_DX0Q', // Fallback is public safe key
            authDomain: 'bedtijdavonturen-prod.firebaseapp.com', // MUST MATCH Firebase Console
            projectId: 'bedtijdavonturen-prod',
            storageBucket: 'bedtijdavonturen-prod.firebasestorage.app',
            messagingSenderId: '340393072153',
            appId: '1:340393072153:web:a58f7ca8d5ac620c41fc88'
        }
    } catch (error) {
        console.error("Critical: Failed to get/construct Firebase Config. Using Hardcoded Fallback.", error)
        return {
            apiKey: 'AIzaSyD_AuWiMYgDc-JXhwPJu3l_Ilo42a_DX0Q',
            authDomain: 'bedtijdavonturen-prod.firebaseapp.com',
            projectId: 'bedtijdavonturen-prod',
            storageBucket: 'bedtijdavonturen-prod.firebasestorage.app',
            messagingSenderId: '340393072153',
            appId: '1:340393072153:web:a58f7ca8d5ac620c41fc88'
        }
    }
}
