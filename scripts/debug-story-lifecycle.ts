
import { getAdminDb } from '../src/lib/firebase/admin';
import { getStory } from '../src/lib/firebase/admin-db';
import { Timestamp } from 'firebase-admin/firestore';

async function main() {
    console.log('--- STARTING STORY DEBUG ---');

    // 1. Create a dummy story directly via Admin DB
    const db = await getAdminDb();
    console.log('Got Admin DB instance');

    const newStory = {
        title: 'Debug Story',
        childName: 'Tester',
        ageGroup: '4-7',
        mood: 'Rustig',
        minutes: 5,
        excerpt: 'Just a test.',
        body: [],
        dialogicPrompts: [],
        userId: 'debug-user',
        profileId: 'debug-profile',
        createdAt: new Date() // Sending Date object, should be converted to Timestamp by Firestore
    };

    console.log('Adding document...');
    const docRef = await db.collection('stories').add(newStory);
    console.log(`Document added with ID: ${docRef.id}`);

    // 2. Fetch immediately via getStory
    console.log('Fetching immediately via getStory...');
    const story = await getStory(docRef.id);

    if (story) {
        console.log('✅ Story found!');
        console.log('Title:', story.title);
        console.log('ID:', story.id);
    } else {
        console.error('❌ Story NOT found immediately after creation.');
    }

    // 3. Cleanup
    console.log('Cleaning up...');
    await db.collection('stories').doc(docRef.id).delete();
    console.log('Done.');
}

main().catch(console.error);
