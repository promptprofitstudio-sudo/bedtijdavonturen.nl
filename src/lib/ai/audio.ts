import { StoryMood } from "@/lib/types"
import { uploadStoryAudio } from "@/lib/firebase/admin-storage"
import { getSecret } from "@/lib/secrets"

// Voice Configuration
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
        throw new Error("Missing ELEVENLABS_API_KEY")
    }

    // Voice Selection Logic
    // Rustig/Troost -> Female (Default)
    // Dapper/Grappig -> Male
    let voiceId = await getSecret('EL_VOICE_FEMALE')

    if (mood === 'Dapper' || mood === 'Grappig') {
        const maleVoice = await getSecret('EL_VOICE_MALE')
        // Fallback to female if male not set? No, prefer error to ensure config is correct.
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
        // Explicitly request MP3 44.1kHz 128kbps typical for ElevenLabs/Web
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                model_id: MODEL_ID,
                voice_settings: VOICE_SETTINGS
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(`ElevenLabs API Error: ${JSON.stringify(errorData)}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to Firebase Storage using Admin SDK
        const downloadUrl = await uploadStoryAudio(storyId, buffer, userId)
        return downloadUrl

    } catch (error) {
        console.error("Error generating/uploading audio:", error)
        throw error
    }
}
