import { config } from "dotenv";
config({ path: ".env.local" });
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

async function run() {
    try {
        console.log("Fetching ALL journal entries...");
        const snapshot = await db.collection("entries")
            .where("type", "==", "journal")
            .get();
                    
        const batch = db.batch();
        let restoreCount = 0;
        
        for (const doc of snapshot.docs) {
            batch.update(doc.ref, { isDeleted: false });
            restoreCount++;
            console.log(`Setting isDeleted=false for ${doc.id}`);
        }
        
        if (restoreCount > 0) {
            await batch.commit();
        }
        
        console.log(`Successfully forced 'isDeleted': false on ${restoreCount} journals!`);
    } catch (e) {
        console.error("Failed to restore entries", e);
    }
}

run();
