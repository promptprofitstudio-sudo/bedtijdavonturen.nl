import 'dotenv/config'
import { generateAudio } from '@/lib/ai/audio'
import { getSecret } from '@/lib/secrets'

// Usage: npx tsx scripts/debug-audio-generation.ts

async function main() {
    console.log('🔍 Checking Audio Configuration...')

    const apiKey = await getSecret('ELEVENLABS_API_KEY')
    const voiceFemale = await getSecret('EL_VOICE_FEMALE')
    const voiceMale = await getSecret('EL_VOICE_MALE')

    console.log('Secrets Status:')
    console.log(`- API Key: ${apiKey ? '✅ Found' : '❌ MISSING'} (${apiKey?.substring(0, 4)}...)`)
    console.log(`- Female Voice: ${voiceFemale ? '✅ Found' : '❌ MISSING'} (${voiceFemale})`)
    console.log(`- Male Voice: ${voiceMale ? '✅ Found' : '❌ MISSING'} (${voiceMale})`)

    if (!apiKey || !voiceFemale) {
        console.error('❌ Critical secrets missing. Cannot proceed.')
        return
    }

    // Attempt generation
    console.log('\n🎙️ Attempting Audio Generation (Dry Run - just calling function)...')
    // We need to mock uploadStoryAudio because we don't want to upload to real storage/db if not needed,
    // actually generateAudio calls uploadStoryAudio internally.
    // If we run this, it WILL try to upload.
    // Let's assume upload works (verified earlier) and focus on generate.
    // We'll pass a fake storyID.

    try {
        const url = await generateAudio({
            text: 'Dit is een test van het audio systeem.',
            mood: 'Rustig',
            storyId: 'debug-test-id',
            userId: 'debug-user-id'
        })
        console.log('✅ Success! Audio URL:', url)
    } catch (error) {
        console.error('❌ Generation Failed:', error)
        if (error instanceof Error) {
            console.error('Message:', error.message)
            console.error('Stack:', error.stack)
        }
    }
}

main()
