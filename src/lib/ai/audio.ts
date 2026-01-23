import { StoryMood } from "@/lib/types"
import { uploadStoryAudio } from "@/lib/firebase/admin-storage"
import { getSecret } from "@/lib/secrets"
import { ElevenLabsClient } from "elevenlabs"

const VOICE_SETTINGS = {
    stability: 0.65,
    similarity_boost: 0.75,
    style: 0.10,
    use_speaker_boost: true
}

const MODEL_ID = "eleven_multilingual_v2"

interface GenerateAudioParams {
    text: string
    mood: StoryMood
    storyId: string
    userId: string
}

export async function generateAudio({ text, mood, storyId, userId }: GenerateAudioParams): Promise<string> {
    const apiKey = await getSecret('ELEVENLABS_API_KEY')
    if (!apiKey) {
        console.error("❌ AudioGen: Missing ELEVENLABS_API_KEY")
        throw new Error("Missing ELEVENLABS_API_KEY")
    }

    // Log key details to stderr for visibility in Cloud Run logs
    console.error(`AudioGen: Key Details. Len: ${apiKey.length}. EndsOnNewline: ${apiKey.endsWith('\n')}. First3: ${apiKey.slice(0, 3)}. Last3: ${apiKey.slice(-3)}`)

    const client = new ElevenLabsClient({
        apiKey: apiKey
    })

    // Verify Voice configuration
    let voiceId = await getSecret('EL_VOICE_FEMALE')
    console.error(`AudioGen: Default Voice ID loaded. Present: ${!!voiceId}`)

    if (mood === 'Dapper' || mood === 'Grappig') {
        const maleVoice = await getSecret('EL_VOICE_MALE')
        console.error(`AudioGen: Male Voice ID loaded. Present: ${!!maleVoice}`)

        if (maleVoice) {
            voiceId = maleVoice
        } else {
            console.warn("EL_VOICE_MALE not set, falling back to female/default if available")
        }
    }

    if (!voiceId) {
        throw new Error(`Missing Voice ID configuration (EL_VOICE_FEMALE / EL_VOICE_MALE) for mood: ${mood}`)
    }

    try {
        console.error(`AudioGen: Attempting conversion. Text Len: ${text.length}. VoiceID: ${voiceId}`)

        const audioStream = await client.textToSpeech.convert(voiceId, {
            text,
            model_id: MODEL_ID,
            voice_settings: VOICE_SETTINGS,
            output_format: "mp3_44100_128"
        })

        const chunks: Buffer[] = []
        for await (const chunk of audioStream) {
            chunks.push(Buffer.from(chunk))
        }
        const buffer = Buffer.concat(chunks)

        // Upload to Firebase Storage using Admin SDK
        const downloadUrl = await uploadStoryAudio(storyId, buffer, userId)
        return downloadUrl

    } catch (error) {
        console.error("Error generating/uploading audio:", error)
        try {
            // Deep inspection of error object for 401 debugging
            console.error("AudioGen Error Detail:", JSON.stringify(error, null, 2))
        } catch (e) { /* ignore circular */ }
        throw error
    }
}
