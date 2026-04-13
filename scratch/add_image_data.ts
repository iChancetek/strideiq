import admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'))
    });
}

const db = getFirestore(admin.app(), "default");

async function addEntry() {
    const users = await db.collection("users").where("email", "==", "chancellor@ichancetek.com").get();
    if (users.empty) {
        console.error("User not found");
        return;
    }
    const uid = users.docs[0].id;

    const activityData = {
        userId: uid,
        type: "Run",
        title: "Evening Run",
        distance: 2.89,
        duration: 2168, // 36m 8s
        pace: "12'30\"/mi",
        calories: 289,
        steps: 4092,
        date: Timestamp.fromDate(new Date("2026-04-10T18:50:00")),
        isPublic: true,
        mode: "run",
        environment: "outdoor",
        createdAt: Timestamp.now()
    };

    console.log(`[ADD] Adding entry for Chancellor...`);
    const docRef = await db.collection("entries").add(activityData);
    console.log(`[ADD] Successfully added entry with ID: ${docRef.id}`);
}

addEntry().catch(console.error);
