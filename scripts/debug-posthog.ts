
import 'dotenv/config'
import { PostHog } from 'posthog-node'

async function testPostHog() {
    // GSM Enforcement
    // We need to import getSecret from a relative path or implementation.
    // Since this is a standalone script, we might need the GSM client logic here or import it.
    // 'src/lib/secrets' is usually available.

    // Dynamic import to avoid relative path hell if moved, but assuming structure:
    const { getSecret } = await import('../src/lib/secrets')

    const key = await getSecret('NEXT_PUBLIC_POSTHOG_KEY')
    const host = await getSecret('NEXT_PUBLIC_POSTHOG_HOST')

    console.log('Testing PostHog with:', { key: key?.substring(0, 8) + '...', host })

    if (!key) throw new Error('No key in GSM')

    const client = new PostHog(key, { host })

    console.log('Capturing event...')
    client.capture({
        distinctId: 'test-user-' + Date.now(),
        event: 'story_generated',
        properties: {
            story_id: 'test-story',
            mood: 'Blij',
            age_group: '4-7',
            source: 'debug-script'
        }
    })

    console.log('Flushing...')
    await client.shutdown()
    console.log('Done.')
}

testPostHog()
