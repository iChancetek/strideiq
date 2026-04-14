import { config } from 'dotenv';
config({ path: '.env.local' });
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '';
let parsedKey = JSON.parse(key.startsWith('"') ? JSON.parse(key) : key);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: parsedKey.project_id,
            privateKey: parsedKey.private_key.replace(/\\n/g, '\n'),
            clientEmail: parsedKey.client_email
        })
    });
}

const db = getFirestore(admin.app(), 'default');

async function findSession() {
    console.log("Searching for 20+ hour sessions...");
    const userId = "7veZQx0WFNaTAjxQRYnTfqgfFKF2";
    
    // Check entries
    const entries = await db.collection("entries")
        .where("userId", "==", userId)
        .where("type", "==", "Fasting")
        .get();
    
    console.log(`Found ${entries.size} fasting entries.`);
    entries.docs.forEach(doc => {
        const d = doc.data();
        console.log(`ENTRY: ${doc.id} | Duration: ${d.duration} | Goal: ${d.goal} | isDeleted: ${d.isDeleted}`);
    });

    // Check user subcollection
    const subSnap = await db.collection("users").doc(userId).collection("fasting_sessions").get();
    console.log(`Found ${subSnap.size} session logs.`);
    subSnap.docs.forEach(doc => {
        const d = doc.data();
        console.log(`LOG: ${doc.id} | Status: ${d.status} | Duration: ${d.duration} | Notes: ${d.notes}`);
    });
}

findSession();
