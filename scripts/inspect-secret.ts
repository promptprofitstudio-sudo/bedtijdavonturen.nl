import { getSecret } from '@/lib/secrets'

async function main() {
    console.log('🔍 Inspecting Secret Content...')
    const key = await getSecret('ELEVENLABS_API_KEY')
    if (!key) {
        console.error('❌ Key is undefined')
        return
    }
    console.log(`Key Length: ${key.length}`)
    console.log(`Ends with newline? ${key.endsWith('\n')}`)
    console.log(`Ends with carriage return? ${key.endsWith('\r')}`)
    console.log(`First 4 chars: ${key.substring(0, 4)}`)
    console.log(`Last 4 chars: ${key.substring(key.length - 4)}`)

    // Check for whitespace
    if (key.trim() !== key) {
        console.warn('⚠️ WARNING: Key has leading/trailing whitespace!')
    } else {
        console.log('✅ Key is clean (no surrounding whitespace).')
    }
}

main()
