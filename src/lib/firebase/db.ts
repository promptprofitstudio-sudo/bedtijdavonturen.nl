import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    Firestore
} from 'firebase/firestore'
import { initializeFirebaseServices, FirebaseServices } from '@/lib/firebase'
import { getFirebaseClientConfig } from '@/app/actions/get-client-config'
import { UserData, ChildProfile, Story, StorySchema } from '@/lib/types'

// Helper to ensure we have a valid DB instance on the server
async function getDb(): Promise<Firestore> {
    const config = await getFirebaseClientConfig()
    if (!config.apiKey) throw new Error('Missing Firebase Config')
    const services = initializeFirebaseServices(config)
    return services.db
}

// --- USERS ---

export async function getUser(uid: string): Promise<UserData | null> {
    const db = await getDb()
    const snap = await getDoc(doc(db, 'users', uid))
    if (!snap.exists()) return null
    return snap.data() as UserData
}

// --- PROFILES ---

export async function createProfile(userId: string, data: Omit<ChildProfile, 'id' | 'createdAt'>): Promise<string> {
    const db = await getDb()
    const profilesRef = collection(db, 'users', userId, 'profiles')

    const docRef = await addDoc(profilesRef, {
        ...data,
        createdAt: Timestamp.now()
    })
    return docRef.id
}

export async function getProfiles(userId: string): Promise<ChildProfile[]> {
    const db = await getDb()
    const q = query(collection(db, 'users', userId, 'profiles'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as ChildProfile[]
}

export async function deleteProfile(userId: string, profileId: string): Promise<void> {
    const db = await getDb()
    await deleteDoc(doc(db, 'users', userId, 'profiles', profileId))
}

export async function updateProfile(userId: string, profileId: string, data: Partial<Omit<ChildProfile, 'id' | 'createdAt'>>): Promise<void> {
    const db = await getDb()
    await updateDoc(doc(db, 'users', userId, 'profiles', profileId), data)
}

// --- STORIES ---

export async function createStory(storyData: Omit<Story, 'id' | 'createdAt'>): Promise<string> {
    const db = await getDb()

    // Create story in root 'stories' collection (or subcollection? User manual implied root 'Story (Firestore)')
    // Let's assume root for easier shared access later, or subcollection?
    // User Prompt: "Store: Story (Firestore): Titel, tekst..." - DOES NOT specify location.
    // Product Context says: "- User (Auth) ... - Profile (Firestore) ... - Story (Firestore)"
    // Keeping it simple: Root 'stories' collection with userId/profileId fields is standard NoSQL for this scale.

    const storiesRef = collection(db, 'stories')
    const newStory = {
        ...storyData,
        createdAt: Timestamp.now()
    }

    // Sanity check with Zod (Optional but good for strictness, though we cast Omit above)
    // StorySchema.omit({ id: true, createdAt: true }).parse(storyData)

    const docRef = await addDoc(storiesRef, newStory)

    // Optionally update user's profile to reference this story? 
    // For now, simple insert.

    return docRef.id
}

export async function getStory(storyId: string): Promise<Story | null> {
    const db = await getDb()
    const snap = await getDoc(doc(db, 'stories', storyId))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as Story
}

export async function getUserStories(userId: string): Promise<Story[]> {
    const db = await getDb()
    const q = query(
        collection(db, 'stories'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Story[]
}

export async function updateStoryAudio(storyId: string, audioUrl: string): Promise<void> {
    const db = await getDb()
    await updateDoc(doc(db, 'stories', storyId), {
        audioUrl
    })
}
