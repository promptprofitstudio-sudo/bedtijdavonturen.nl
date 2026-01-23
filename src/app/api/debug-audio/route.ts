import { NextResponse } from 'next/server'
import { getSecret } from '@/lib/secrets'
import { ElevenLabsClient } from 'elevenlabs'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const apiKey = await getSecret('ELEVENLABS_API_KEY')
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing Key' }, { status: 500 })
        }

        const client = new ElevenLabsClient({ apiKey })

        // Test Authentication
        try {
            const userInfo = await client.user.get()
            const subscription = await client.user.getSubscription()

            return NextResponse.json({
                status: 'Combined Success',
                keyPreview: apiKey.slice(0, 5) + '...',
                user: userInfo, // Dump whole object to avoid type errors
                subscription: subscription
            })
        } catch (apiError: any) {
            return NextResponse.json({
                error: 'ElevenLabs API Error',
                details: apiError,
                message: apiError.message,
                statusCode: apiError.statusCode,
                body: apiError.body
            }, { status: 401 })
        }

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
