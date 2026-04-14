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

async function deepSearch() {
    console.log("Starting deep search for 'amazing'...");
    
    try {
        // 1. Check top-level 'entries'
        console.log("Checking top-level 'entries'...");
        const entriesSnap = await db.collection("entries").get();
        entriesSnap.docs.forEach(doc => {
            const d = doc.data();
            if (JSON.stringify(d).toLowerCase().includes("amazing")) {
                console.log("MATCH FOUND in 'entries':", doc.id, JSON.stringify(d));
            }
        });

        // 2. Check user sub-collections
        console.log("Checking user sub-collections...");
        const usersSnap = await db.collection("users").get();
        for (const uDoc of usersSnap.docs) {
            const fastingSnap = await uDoc.ref.collection("fasting_sessions").get();
            fastingSnap.docs.forEach(doc => {
                const d = doc.data();
                if (JSON.stringify(d).toLowerCase().includes("amazing")) {
                    console.log(`MATCH FOUND in 'users/${uDoc.id}/fasting_sessions':`, doc.id, JSON.stringify(d));
                }
            });
            
            const journalsSnap = await uDoc.ref.collection("journals").get();
            journalsSnap.docs.forEach(doc => {
                const d = doc.data();
                if (JSON.stringify(d).toLowerCase().includes("amazing")) {
                    console.log(`MATCH FOUND in 'users/${uDoc.id}/journals':`, doc.id, JSON.stringify(d));
                }
            });
        }
        
    } catch (e) {
        console.error("Search failed:", e);
    }
}

deepSearch();
