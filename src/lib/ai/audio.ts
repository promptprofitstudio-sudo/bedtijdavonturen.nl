import { StoryMood } from "@/lib/types"
import { uploadStoryAudio } from "@/lib/firebase/admin-storage"
import { getSecret } from "@/lib/secrets"

// Removed SDK import to use native fetch for debugging
// import { ElevenLabsClient } from "elevenlabs"

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

    console.error(`AudioGen: Key Loaded. Len: ${apiKey.length}. EndsOnNewline: ${apiKey.endsWith('\n')}. First3: ${apiKey.slice(0, 3)}. Last3: ${apiKey.slice(-3)}`)

    // Voice Selection Logic
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

    console.error(`AudioGen: Attempting Raw Fetch. Text Len: ${text.length}. VoiceID: ${voiceId}`)

    try {
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`
        const payload = {
            text,
            model_id: MODEL_ID,
            voice_settings: VOICE_SETTINGS,
            // output_format not supported in JSON body for stream/TFS, but usually query param?
            // SDK puts it in query or body? API docs say Query Param for output_format usually?
            // Let's try standard body first.
        }

        // Add output_format via query param as per reliable API patterns
        // Defaults to mp3_44100_128 if unrelated.

        console.error(`AudioGen: Payload Preview: ${JSON.stringify({ ...payload, text: text.substring(0, 20) + '...' })}`)

        const response = await fetch(`${url}?output_format=mp3_44100_128`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey, // Correct Header for ElevenLabs
                'Content-Type': 'application/json',
                'Accept': 'audio/mpeg'
            },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`❌ ElevenLabs API Error: ${response.status} ${response.statusText}`)
            console.error(`❌ Raw Error Body: ${errorText}`)
            throw new Error(`ElevenLabs API Failed: ${response.status} ${response.statusText} - ${errorText}`)
        }

        // Get ArrayBuffer from response
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to Firebase Storage using Admin SDK
        const downloadUrl = await uploadStoryAudio(storyId, buffer, userId)
        return downloadUrl

    } catch (error) {
        console.error("Error generating/uploading audio (Raw Fetch):", error)
        throw error
    }
}
