import { config } from 'dotenv';
config({ path: '.env.local' });
import * as admin from 'firebase-admin';

// Initialize Admin SDK with service account from env
let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '';
let parsedKey;
try {
    if (key.startsWith("{")) {
        parsedKey = JSON.parse(key);
    } else if (key.startsWith('"')) {
        parsedKey = JSON.parse(JSON.parse(key)); 
    } else {
        throw new Error("Format unknown");
    }
} catch (e) {
    console.error("Parse Error:", e);
    process.exit(1);
}

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

async function restoreAll() {
    console.log("Restoration Process Starting...");
    try {
        const snapshot = await db.collection("entries")
            .where("isDeleted", "==", true)
            .get();

        if (snapshot.empty) {
            console.log("No deleted items found to restore.");
            return;
        }

        console.log(`Found ${snapshot.size} items to restore.`);

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, {
                isDeleted: false,
                deletedAt: null,
                restoredAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();
        console.log("SUCCESS: All soft-deleted items have been restored.");
    } catch (error) {
        console.error("Restoration Failed:", error);
    }
}

restoreAll();
