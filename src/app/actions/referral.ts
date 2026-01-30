'use server'

import { redeemReferralCode } from '@/lib/firebase/referrals'
import { getCurrentUser } from '@/lib/firebase/server-auth'
import { revalidatePath } from 'next/cache'

export async function redeemCodeAction(code: string) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return { success: false, error: 'Je moet ingelogd zijn.' }
        }

        const result = await redeemReferralCode(user.uid, code)

        if (result.success) {
            revalidatePath('/account') // Refresh account page to show new credits
            return { success: true, message: result.message, credits: result.creditsGranted }
        } else {
            return { success: false, error: result.message }
        }
    } catch (error: any) {
        return { success: false, error: 'Er ging iets mis.' }
    }
}
