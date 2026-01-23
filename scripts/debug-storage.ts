
import { getAdminApp } from '@/lib/firebase/admin'
import { getStorage } from 'firebase-admin/storage'

async function testStorage() {
    console.log('🧪 Testing Storage Upload & MakePublic...')
    try {
        const app = await getAdminApp()
        const bucket = getStorage(app).bucket()
        const TEST_FILE = 'debug-audio-test.txt'
        const file = bucket.file(TEST_FILE)

        console.log(`📂 Bucket: ${bucket.name}`)
        console.log(`📄 File: ${TEST_FILE}`)

        // 1. Save
        console.log('1️⃣ Saving file...')
        await file.save('Hello from Debug Script', {
            contentType: 'text/plain',
            metadata: { debug: 'true' }
        })
        console.log('✅ Save successful')

        // 2. Make Public
        console.log('2️⃣ Attempting makePublic()...')
        await file.makePublic()
        console.log('✅ makePublic successful')

        console.log(`🔗 URL: ${file.publicUrl()}`)

    } catch (error: any) {
        console.error('❌ Storage Test Failed:', error)
        console.error('Code:', error.code)
        console.error('Message:', error.message)
    }
}

testStorage()
