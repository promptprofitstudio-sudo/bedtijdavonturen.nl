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
    customVoiceId?: string | null // [NEW] Optional custom voice
}

export async function generateAudio({ text, mood, storyId, userId, customVoiceId }: GenerateAudioParams): Promise<string> {
    const apiKey = await getSecret('ELEVENLABS_API_KEY')
    if (!apiKey) {
        console.error("❌ AudioGen: Missing ELEVENLABS_API_KEY")
        throw new Error("Missing ELEVENLABS_API_KEY")
    }

    const client = new ElevenLabsClient({
        apiKey: apiKey
    })

    // Voice Selection Logic
    let voiceId: string | undefined = customVoiceId || undefined

    if (!voiceId) {
        // Fallback to defaults
        voiceId = await getSecret('EL_VOICE_FEMALE')

        if (mood === 'Dapper' || mood === 'Grappig') {
            const maleVoice = await getSecret('EL_VOICE_MALE')
            if (maleVoice) {
                voiceId = maleVoice
            } else {
                console.warn("EL_VOICE_MALE not set, falling back to female/default if available")
            }
        }
    }

    if (!voiceId) {
        throw new Error(`Missing Voice ID configuration for mood: ${mood}`)
    }

    console.log(`AudioGen: Generating... Mood: ${mood}, Voice: ${voiceId}`)

    try {
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
        throw error
    }
}
