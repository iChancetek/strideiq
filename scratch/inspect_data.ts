import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'))
    });
}

async function inspect() {
    const db = getFirestore(admin.app(), "default");
    const snapshot = await db.collection("entries")
        .where("userId", "==", "7OaA7oP9T7VjPzO0Z3Y0Xy4vS2") // Admin ID or Chancellor's UID?
        // Let's search by email in users collection first to be sure
        .get();

    console.log(`Found ${snapshot.docs.length} activities.`);
    snapshot.docs.forEach(doc => {
        const d = doc.data();
        console.log(`[${doc.id}] Type: ${d.type}, Distance: ${d.distance}, Date: ${d.date}`);
    });
}

inspect();
