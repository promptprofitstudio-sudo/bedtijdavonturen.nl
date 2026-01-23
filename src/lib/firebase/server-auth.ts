import { cookies } from 'next/headers'
import { getAdminAuth } from './admin' // Assuming this exports getAuth() from firebase-admin
import { UserData } from '@/lib/types'

export async function getCurrentUser(): Promise<UserData | null> {

    // TEST MODE BYPASS
    if (process.env.TEST_MODE === 'true') {
        return {
            uid: 'test-user-id',
            email: 'test@example.com',
            displayName: 'Test User',
            subscriptionStatus: 'premium',
            createdAt: new Date() as any
        }
    }

    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value

    if (!sessionCookie) return null

    try {
        const auth = await getAdminAuth()
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)

        // Return minimal user data needed for owner check
        return {
            uid: decodedClaims.uid,
            email: decodedClaims.email || null,
            displayName: null,
            subscriptionStatus: 'free', // Defaults, would need DB fetch for real status
            createdAt: new Date() as any
        }
    } catch (error) {
        // console.error("Server Auth Error:", error)
        return null
    }
}
