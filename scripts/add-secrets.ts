
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

const client = new SecretManagerServiceClient()
const projectId = 'bedtijdavonturen-prod'

async function addSecret(name: string, value: string) {
    try {
        const parent = `projects/${projectId}`

        // 1. Try to create the secret (container)
        try {
            await client.createSecret({
                parent,
                secretId: name,
                secret: {
                    replication: {
                        automatic: {},
                    },
                },
            })
            console.log(`✅ Created secret container: ${name}`)
        } catch (error: any) {
            if (error.code === 6) { // ALREADY_EXISTS
                console.log(`ℹ️ Secret container ${name} already exists.`)
            } else {
                throw error
            }
        }

        // 2. Add a new version
        const [version] = await client.addSecretVersion({
            parent: `projects/${projectId}/secrets/${name}`,
            payload: {
                data: Buffer.from(value, 'utf8'),
            },
        })

        console.log(`✅ Added new version to ${name}: ${version.name}`)
    } catch (error: any) {
        console.error(`❌ Failed to add secret ${name}:`, error.message)
    }
}

async function main() {
    console.log('🔐 Adding PostHog Secrets to GSM...')

    await addSecret('NEXT_PUBLIC_POSTHOG_HOST', 'https://eu.i.posthog.com')
    // Re-adding Key just in case, or skipping if known good. User asked to "add secrets".
    // I'll skip the key if it matches what we found, but adding a version is harmless (idempotent-ish).
    // Actually, let's just do the Host as it was the missing one.

    console.log('Done.')
}

main()
