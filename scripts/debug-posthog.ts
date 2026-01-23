
import 'dotenv/config'
import { PostHog } from 'posthog-node'

async function testPostHog() {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

    console.log('Testing PostHog with:', { key: key?.substring(0, 8) + '...', host })

    if (!key) throw new Error('No key')

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
