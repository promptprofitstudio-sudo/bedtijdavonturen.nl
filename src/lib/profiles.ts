import { ChildProfile } from '@/lib/types'
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    Timestamp,
    query,
    orderBy,
    Firestore
} from 'firebase/firestore'

// Collection reference helper
const getProfilesRef = (db: Firestore, userId: string) => collection(db, 'users', userId, 'profiles')

export async function getProfiles(db: Firestore, userId: string): Promise<ChildProfile[]> {
    const q = query(getProfilesRef(db, userId), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as ChildProfile[]
}

export async function createProfile(db: Firestore, userId: string, data: Omit<ChildProfile, 'id' | 'createdAt'>): Promise<string> {
    const profileData = {
        ...data,
        createdAt: Timestamp.now()
    }

    const docRef = await addDoc(getProfilesRef(db, userId), profileData)
    return docRef.id
}

export async function updateProfile(db: Firestore, userId: string, profileId: string, data: Partial<ChildProfile>) {
    const docRef = doc(db, 'users', userId, 'profiles', profileId)
    await updateDoc(docRef, data)
}

export async function deleteProfile(db: Firestore, userId: string, profileId: string) {
    const docRef = doc(db, 'users', userId, 'profiles', profileId)
    await deleteDoc(docRef)
}
