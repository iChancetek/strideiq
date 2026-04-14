import { config } from 'dotenv';
config({ path: '.env.local' });
import * as admin from 'firebase-admin';

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

const db = admin.firestore();

async function checkSoftDeletes() {
    console.log("Checking for ANY documents with isDeleted: true...");
    try {
        const snapshot = await db.collection("entries").where("isDeleted", "==", true).get();
        console.log(`Found ${snapshot.size} soft-deleted entries.`);
        snapshot.docs.forEach(doc => {
            console.log("ID:", doc.id, "Type:", doc.data().type, "Notes:", doc.data().notes, "User:", doc.data().userId);
        });
    } catch (e) {
        console.error("Query failed:", e);
    }
}

checkSoftDeletes();
