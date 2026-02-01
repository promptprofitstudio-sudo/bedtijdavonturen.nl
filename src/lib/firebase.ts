import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

export type FirebaseServices = {
    app: FirebaseApp
    auth: Auth
    db: Firestore
    storage: FirebaseStorage
}

export function initializeFirebaseServices(config: any): FirebaseServices {
    // 1. Debug Check
    if (process.env.NODE_ENV !== 'production' || !config.apiKey) {
        console.log('[Firebase Init] Checking Config Keys:', {
            apiKey: config.apiKey ? 'Present' : 'MISSING',
            authDomain: config.authDomain ? 'Present' : 'MISSING',
            projectId: config.projectId ? 'Present' : 'MISSING',
        });
    }

    if (!config.apiKey || !config.authDomain) {
        console.error('[Firebase Init] CRITICAL: Missing required config keys.');
        // We technically could throw, but returning the last known app might be safer?
        // For now, let's proceed to allow standard Firebase error handling to catch it if initialization fails.
    }

    // 2. Singleton Pattern
    const app = getApps().length > 0 ? getApp() : initializeApp(config)

    // 3. Export instances
    return {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
        storage: getStorage(app)
    }
}
