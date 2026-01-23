
import { getAdminApp } from '@/lib/firebase/admin'
import { getStorage } from 'firebase-admin/storage'

async function testStorage() {
    console.log('🧪 Testing Storage Access...')
    try {
        const app = await getAdminApp()
        const projectId = app.options.projectId || 'unknown'
        console.log(`🆔 App Project ID: ${projectId}`)

        const bucket = getStorage(app).bucket()
        console.log(`📂 Bucket: ${bucket.name}`)

        // 1. LIST Files (Read Check)
        console.log('1️⃣ Attempting to LIST files...')
        try {
            const [files] = await bucket.getFiles({ maxResults: 5 })
            console.log(`✅ List successful. Found ${files.length} files.`)
            files.forEach(f => console.log(`   - ${f.name}`))
        } catch (e: any) {
            console.error('❌ List Failed:', e.message)
        }

        // 2. Save (Write Check)
        console.log('2️⃣ Attempting to SAVE file...')
        const TEST_FILE = 'debug-billing-check.txt'
        const file = bucket.file(TEST_FILE)

        await file.save('Billing Check Payload', {
            contentType: 'text/plain'
        })
        console.log('✅ Save successful')

    } catch (error: any) {
        console.error('❌ Write Failed:', error.message)
        if (error.code) console.error('Code:', error.code)
        // console.error('Full Error:', JSON.stringify(error, null, 2))
    }
}

testStorage()
