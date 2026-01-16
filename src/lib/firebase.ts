import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

// We no longer export singleton instances initialized from process.env
// Instead, we export types and a factory function

export type FirebaseServices = {
    app: FirebaseApp
    auth: Auth
    db: Firestore
    storage: FirebaseStorage
}

export function initializeFirebaseServices(config: any): FirebaseServices {
    const app = !getApps().length ? initializeApp(config) : getApp()
    return {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
        storage: getStorage(app)
    }
}
