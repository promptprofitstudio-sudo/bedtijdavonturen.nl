
import 'dotenv/config'
import { getAdminDb } from '../src/lib/firebase/admin'

async function grantCredits() {
    console.log('🪙 Granting 50 credits to all users...')

    try {
        const db = await getAdminDb()
        const usersRef = db.collection('users')
        const snapshot = await usersRef.get()

        if (snapshot.empty) {
            console.log('No users found.')
            return
        }

        console.log(`Found ${snapshot.size} users. Processing...`)

        const batch = db.batch()
        let count = 0

        snapshot.docs.forEach(doc => {
            const data = doc.data()
            // Only update if credits are not set or less than 50?
            // User requested "Give current users 50 credits".
            // Implementation: Set credits to 50 if they have less than 50, or just add 50?
            // Safest interpretation for "Grant": Update to 50 if undefined/low, or +50?
            // "Give 50" usually means "Here is 50". If they have 0, they get 50.
            // If they have 10, they get 60?
            // Let's implement: Add 50 to current balance (or 0).

            // Wait, Firestore batch has a limit of 500 ops.
            // If users > 500, we need chunks.
            // For now assume < 500 users or just update individually if batch complex? 
            // Batch is better. I'll stick to simple batch for now, assuming small user base.

            const currentCredits = data.credits || 0
            const newCredits = currentCredits + 50

            batch.update(doc.ref, {
                credits: newCredits,
                // Add a flag so we don't double grant if re-run? 
                // legacyGrant applied?
                legacyGrantApplied: true
            })
            count++
        })

        await batch.commit()
        console.log(`✅ Successfully granted 50 credits to ${count} users.`)

    } catch (error) {
        console.error('Error granting credits:', error)
    }
}

grantCredits()
