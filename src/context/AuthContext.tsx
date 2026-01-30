'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser,
    Auth
} from 'firebase/auth'
import { initializeFirebaseServices, FirebaseServices } from '@/lib/firebase'
import { getFirebaseClientConfig } from '@/app/actions/get-client-config'
import { doc, getDoc, setDoc, collection, getDocs, addDoc, Timestamp, Firestore } from 'firebase/firestore'
import { UserData } from '@/lib/types'

interface AuthContextType {
    user: UserData | null
    loading: boolean
    signInWithGoogle: () => Promise<void>
    signInWithEmail: (email: string, pass: string) => Promise<void>
    registerWithEmail: (email: string, pass: string, name: string) => Promise<void>
    signOut: () => Promise<void>
    db: Firestore | null // Expose DB for other services
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserData | null>(null)
    const [services, setServices] = useState<FirebaseServices | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let unsubscribe: () => void

        const init = async () => {
            try {
                const config = await getFirebaseClientConfig()

                // TEST MODE BYPASS
                if (process.env.NEXT_PUBLIC_TEST_MODE === 'true') {
                    console.warn("⚠️ AuthContext: Running in TEST MODE. Simulating logged-in user.")
                    // Simulate a loaded user
                    setUser({
                        uid: 'test-user-id',
                        email: 'test@example.com',
                        displayName: 'Test User',
                        subscriptionStatus: 'premium',
                        createdAt: Timestamp.now(),
                        customVoiceId: null,
                        credits: 10
                    })
                    setServices(null)
                    setLoading(false)
                    return
                }

                if (!config.apiKey) throw new Error('Failed to load Firebase config from secrets')
                const s = initializeFirebaseServices(config)
                setServices(s)

                console.log("🔐 AuthContext: Initializing...")

                // Force persistence on init
                try {
                    const { setPersistence, browserLocalPersistence } = await import('firebase/auth')
                    await setPersistence(s.auth, browserLocalPersistence)
                    console.log("🔐 AuthContext: Persistence set to local")
                } catch (e) {
                    console.error("❌ AuthContext: Persistence error", e)
                }

                // Handle Redirect Result (for Mobile Auth return)
                try {
                    const { getRedirectResult } = await import('firebase/auth')
                    console.log("🔐 AuthContext: Checking redirect result...")
                    const result = await getRedirectResult(s.auth)
                    if (result?.user) {
                        console.log("✅ Redirect login successful:", result.user.uid)
                        // User state will be handled by onAuthStateChanged below
                    } else {
                        console.log("ℹ️ No redirect result found (Normal page load)")
                    }
                } catch (redirectError: any) {
                    console.error("❌ Redirect login error:", redirectError)
                    console.error("   Message:", redirectError.message)
                    console.error("   Code:", redirectError.code)
                    if (redirectError.code === 'auth/unauthorized-domain') {
                        alert("Fout: Dit domein is niet geautoriseerd in Firebase Auth instellingen.")
                    }
                }

                unsubscribe = onAuthStateChanged(s.auth, async (firebaseUser: FirebaseUser | null) => {
                    console.log("🔐 AuthContext: Auth state changed:", firebaseUser?.uid || 'null')
                    if (firebaseUser) {
                        const userRef = doc(s.db, 'users', firebaseUser.uid)
                        const userSnap = await getDoc(userRef)

                        if (userSnap.exists()) {
                            setUser(userSnap.data() as UserData)
                        } else {
                            const newUser: UserData = {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email || '',
                                displayName: firebaseUser.displayName || null,
                                subscriptionStatus: 'free',
                                createdAt: Timestamp.now(),
                                credits: 0,
                            }
                            await setDoc(userRef, newUser)
                            setUser(newUser)
                        }

                        // Check for profiles and create default if none exist
                        const profilesRef = collection(s.db, 'users', firebaseUser.uid, 'profiles')
                        const profilesSnap = await getDocs(profilesRef)
                        if (profilesSnap.empty) {
                            await addDoc(profilesRef, {
                                name: 'Mijn Kind',
                                ageGroup: '4-7',
                                createdAt: Timestamp.now()
                            })
                        }
                    } else {
                        setUser(null)
                    }
                    setLoading(false)
                })
            } catch (error) {
                console.error('Auth initialization failed:', error)
                setLoading(false)
            }
        }

        init()

        return () => {
            if (unsubscribe) unsubscribe()
        }
    }, [])

    const signInWithGoogle = async () => {
        if (!services) {
            console.error("Firebase services not initialized");
            // alert("De inlog-service is nog aan het laden. Probeer het over enkele seconden opnieuw.");
            return
        }
        const provider = new GoogleAuthProvider()
        try {
            // Import persistence explicitly to bundle it
            const { signInWithRedirect, setPersistence, browserLocalPersistence } = await import('firebase/auth')

            // Force Local Persistence to ensure session survives redirects/refreshes
            await setPersistence(services.auth, browserLocalPersistence)

            await signInWithRedirect(services.auth, provider)
        } catch (error) {
            console.error('Error signing in with Google', error)
            throw error
        }
    }

    const signInWithEmail = async (email: string, pass: string) => {
        if (!services) return
        const { signInWithEmailAndPassword } = await import('firebase/auth')
        await signInWithEmailAndPassword(services.auth, email, pass)
    }

    const registerWithEmail = async (email: string, pass: string, name: string) => {
        if (!services) return
        const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
        const cred = await createUserWithEmailAndPassword(services.auth, email, pass)
        if (cred.user) {
            await updateProfile(cred.user, { displayName: name })
            // Trigger the onAuthStateChanged logic to create DB doc
        }
    }

    const signOut = async () => {
        if (!services) return
        try {
            await firebaseSignOut(services.auth)
            setUser(null)
        } catch (error) {
            console.error('Error signing out', error)
            throw error
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            signInWithGoogle,
            signInWithEmail,
            registerWithEmail,
            signOut,
            db: services?.db || null
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
