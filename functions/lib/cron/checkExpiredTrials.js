"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExpiredTrials = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
exports.checkExpiredTrials = (0, scheduler_1.onSchedule)({
    schedule: "every day 04:00",
    timeZone: "Europe/Amsterdam",
    timeoutSeconds: 300,
    memory: "256MiB",
}, async (event) => {
    const db = admin.firestore();
    const now = Date.now();
    console.log('⏰ Running CheckExpiredTrials Cron Job...');
    // Find users with 'trial' status where trialEndsAt < now
    const snapshot = await db.collection('users')
        .where('subscriptionStatus', '==', 'trial')
        .where('trialEndsAt', '<', now)
        .get();
    if (snapshot.empty) {
        console.log('✅ No expired trials found.');
        return;
    }
    console.log(`🔎 Found ${snapshot.size} expired trials.`);
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        // Set back to 'free'
        batch.update(doc.ref, {
            subscriptionStatus: 'free',
            trialExpiredAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // TODO: Trigger email notification here if needed
        // await triggerTrialEndEmail(doc.data().email);
    });
    await batch.commit();
    console.log(`✅ Successfully downgraded ${snapshot.size} users.`);
});
//# sourceMappingURL=checkExpiredTrials.js.map