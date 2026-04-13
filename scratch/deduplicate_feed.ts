import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'))
    });
}

const db = getFirestore(admin.app(), "default");

async function dedup() {
    console.log("[DEDUP] Starting Activity Feed cleanup...");
    
    // 1. Identify Chancellor
    const users = await db.collection("users").where("email", "==", "chancellor@ichancetek.com").get();
    if (users.empty) {
        console.log("[DEDUP] Chancellor not found. Skipping.");
        return;
    }
    const uid = users.docs[0].id;
    console.log(`[DEDUP] Cleaning feed for UID: ${uid}`);

    // 2. Fetch all unique entries
    const snapshot = await db.collection("entries").where("userId", "==", uid).get();
    console.log(`[DEDUP] Found ${snapshot.size} total entries.`);

    const seen = new Set();
    const toDelete: string[] = [];

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Create a signature for the entry
        // We include date, type, distance, duration, and steps
        const dateStr = data.date?.toDate ? data.date.toDate().toISOString() : data.date;
        const signature = `${data.type}|${dateStr}|${data.distance}|${data.duration}|${data.steps}`;

        if (seen.has(signature)) {
            toDelete.push(doc.id);
        } else {
            seen.add(signature);
        }
    });

    console.log(`[DEDUP] Identified ${toDelete.length} duplicate entries.`);

    // 3. Delete in batches
    if (toDelete.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < toDelete.length; i += batchSize) {
            const batch = db.batch();
            toDelete.slice(i, i + batchSize).forEach(id => {
                batch.delete(db.collection("entries").doc(id));
            });
            await batch.commit();
            console.log(`[DEDUP] Deleted batch ${Math.floor(i / batchSize) + 1}...`);
        }
    }

    console.log("[DEDUP] Cleanup complete.");
}

dedup().catch(console.error);
