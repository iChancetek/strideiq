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

async function searchEntries() {
    console.log("Searching 'entries' collection for 'amazing' or '21h'...");
    try {
        const snapshot = await db.collection("entries").get();
        console.log(`Scanning ${snapshot.size} entries...`);
        
        let found = false;
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const text = JSON.stringify(data).toLowerCase();
            if (text.includes("amazing") || text.includes("21h")) {
                console.log("------------------------------------------");
                console.log("MATCH FOUND!");
                console.log("Doc ID:", doc.id);
                console.log("Type:", data.type);
                console.log("userId:", data.userId);
                console.log("isDeleted:", data.isDeleted);
                console.log("Notes:", data.notes);
                console.log("Content:", data.content);
                console.log("Full Data:", JSON.stringify(data));
                found = true;
            }
        });
        
        if (!found) {
            console.log("No matches found in 'entries'.");
        }
    } catch (e) {
        console.error("Search error:", e);
    }
}

searchEntries();
