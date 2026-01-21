import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

const client = new SecretManagerServiceClient()

// Caching secrets in memory to prevent excessive API calls in warm instances
const secretCache: Record<string, string> = {}

export async function getSecret(name: string): Promise<string | undefined> {
    if (secretCache[name]) {
        return secretCache[name]
    }

    try {
        // Hardcoded project ID for scaffold simplicity
        const projectId = 'bedtijdavonturen-prod'
        const [version] = await client.accessSecretVersion({
            name: `projects/${projectId}/secrets/${name}/versions/latest`,
        })

        const payload = version.payload?.data?.toString()
        if (payload) {
            secretCache[name] = payload
            return payload
        }
        return undefined
    } catch (error) {
        console.error(`Failed to fetch secret ${name}:`, error)
        return undefined
    }
}
