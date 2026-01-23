
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

const client = new SecretManagerServiceClient()
const projectId = 'bedtijdavonturen-prod'

async function getSecret(name: string) {
    try {
        const [version] = await client.accessSecretVersion({
            name: `projects/${projectId}/secrets/${name}/versions/latest`,
        })
        return version.payload?.data?.toString()
    } catch (error) {
        console.error(`❌ Failed to fetch ${name}:`, (error as any).message)
        return null
    }
}

async function validate() {
    console.log('🔐 Validating PostHog Secrets in GSM...')

    const secrets = [
        'NEXT_PUBLIC_POSTHOG_KEY',
        'NEXT_PUBLIC_POSTHOG_HOST',
        'POSTHOG_PERSONAL_API_KEY'
    ]

    for (const name of secrets) {
        const value = await getSecret(name)
        if (value) {
            console.log(`✅ ${name}: FOUND`)
            console.log(`   Value: ${value}`)
        } else {
            console.log(`❌ ${name}: NOT FOUND`)
        }
    }
}

validate()
