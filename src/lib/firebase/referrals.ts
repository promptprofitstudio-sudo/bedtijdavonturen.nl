
import { FieldValue, Transaction } from 'firebase-admin/firestore';
import { getAdminDb } from './admin';

export interface RedeemResult {
    success: boolean;
    message: string;
    creditsGranted?: number;
}

export async function redeemReferralCode(userId: string, code: string): Promise<RedeemResult> {
    if (!userId || !code) {
        return { success: false, message: 'Ongeldige aanvraag.' };
    }

    const normalizedCode = code.trim().toUpperCase();
    const db = await getAdminDb();

    try {
        return await db.runTransaction(async (transaction: Transaction) => {
            // 1. Get User
            const userRef = db.collection('users').doc(userId);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists) {
                throw new Error('Gebruiker niet gevonden.');
            }

            const userData = userDoc.data();
            if (userData?.referredBy) {
                return { success: false, message: 'Je hebt al een code gebruikt.' };
            }

            // 2. Get Partner (Validate Code)
            const partnersQuery = db.collection('partners').where('code', '==', normalizedCode).limit(1);
            const partnerSnapshot = await transaction.get(partnersQuery);

            if (partnerSnapshot.empty) {
                return { success: false, message: 'Ongeldige code.' };
            }

            const partnerDoc = partnerSnapshot.docs[0];
            const partnerRef = partnerDoc.ref;

            // 3. Grant Reward (7 Days Free Trial - VIP Treatment)
            // Credits are NOT touched, they remain for later.
            const TRIAL_DAYS = 7;
            const now = Date.now();
            const trialEndsAt = now + (TRIAL_DAYS * 24 * 60 * 60 * 1000);

            transaction.update(userRef, {
                subscriptionStatus: 'trial',
                trialEndsAt: trialEndsAt,
                referredBy: normalizedCode,
                updatedAt: FieldValue.serverTimestamp()
            });

            // 4. Update Partner Stats
            transaction.update(partnerRef, {
                'stats.redeemed': FieldValue.increment(1),
                lastRedeemedAt: FieldValue.serverTimestamp()
            });

            return {
                success: true,
                message: `VIP Code geaccepteerd! Je hebt ${TRIAL_DAYS} dagen gratis Premium toegang.`,
                creditsGranted: 0
            };
        });
    } catch (error: any) {
        console.error('Redeem Error:', error);
        return { success: false, message: error.message || 'Er ging iets mis.' };
    }
}
