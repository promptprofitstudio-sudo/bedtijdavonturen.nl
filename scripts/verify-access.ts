
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

async function verifyWrite() {
    console.log("Testing Firestore Write Access for bedtijdavonturen-prod...");

    // Force specific project ID
    const projectId = 'bedtijdavonturen-prod';

    if (!getApps().length) {
        initializeApp({ projectId });
    }

    const db = getFirestore();

    try {
        const res = await db.collection('test_writes').add({
            timestamp: new Date(),
            verified: true,
            by: 'verify-access-script'
        });
        console.log("✅ Successfully wrote document:", res.id);
    } catch (e: any) {
        console.error("❌ Failed to write:", e.message);
        // console.error(JSON.stringify(e, null, 2));
    }
}

verifyWrite();
