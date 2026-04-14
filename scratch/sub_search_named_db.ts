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

async function subSearch() {
    console.log("Searching user subcollections in 'default' DB...");
    try {
        const usersSnap = await db.collection("users").get();
        console.log(`Found ${usersSnap.size} users.`);
        
        for (const uDoc of usersSnap.docs) {
            console.log(`Checking user: ${uDoc.id}`);
            const fastingSnap = await uDoc.ref.collection("fasting_sessions").get();
            fastingSnap.docs.forEach(doc => {
                const data = JSON.stringify(doc.data());
                if (data.toLowerCase().includes("amazing")) {
                    console.log("!! MATCH FOUND !! in fasting_sessions:", doc.id);
                    console.log("Data:", data);
                }
            });
        }
    } catch (e) {
        console.error("Sub-search failed:", e);
    }
}

subSearch();
