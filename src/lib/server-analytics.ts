import 'server-only'
import { getSecret } from '@/lib/secrets'

type AnalyticsEvent = {
    userId: string
    event: string
    properties?: Record<string, any>
}

export async function trackServerEvent({ userId, event, properties }: AnalyticsEvent) {
    try {
        const { PostHog } = await import('posthog-node')
        const phKey = await getSecret('NEXT_PUBLIC_POSTHOG_KEY')
        const phHost = (await getSecret('NEXT_PUBLIC_POSTHOG_HOST')) || 'https://app.posthog.com'

        if (!phKey) {
            console.warn('⚠️ PostHog Key not found, skipping analytics.')
            return
        }

        const client = new PostHog(phKey, { host: phHost })

        client.capture({
            distinctId: userId,
            event,
            properties: {
                ...properties,
                app_version: '2.0.0', // Hardcoded for now based on package.json
                environment: process.env.NODE_ENV || 'development'
            }
        })

        await client.shutdown()
    } catch (e) {
        console.error('Failed to capture analytics:', e)
    }
}
