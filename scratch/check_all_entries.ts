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

async function checkAllEntries() {
    console.log("Fetching all entries (limit 50)...");
    try {
        const snapshot = await db.collection("entries").limit(50).get();
        console.log(`Found ${snapshot.size} entries.`);
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log("ID:", doc.id, "Type:", data.type, "Notes:", data.notes, "Title:", data.title, "isDeleted:", data.isDeleted);
        });
    } catch (e) {
        console.error("Query failed:", e);
    }
}

checkAllEntries();
