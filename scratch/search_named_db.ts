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

async function search() {
    console.log("Searching for 'amazing' in named DB 'default'...");
    try {
        const snapshot = await db.collection("entries").get();
        console.log(`Found ${snapshot.size} docs in 'entries'`);
        
        let found = false;
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const text = JSON.stringify(data).toLowerCase();
            if (text.includes("amazing")) {
                console.log("------------------------------------------");
                console.log("MATCH FOUND!");
                console.log("ID:", doc.id);
                console.log("Data:", JSON.stringify(data));
                found = true;
            }
        });
        
        if (!found) {
            console.log("No match found in 'default' entries.");
        }
    } catch (e) {
        console.error("Search failed:", e);
    }
}

search();
