import { config } from 'dotenv';
config({ path: '.env.local' });
import * as admin from 'firebase-admin';

// Initialize Admin SDK
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

async function findEntry() {
    console.log("Searching for the entry with note 'I feel amazing'...");
    try {
        // Search all documents in entries
        const snapshot = await db.collection("entries").get();
        console.log(`Scanning ${snapshot.size} documents...`);

        let found = false;
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            // Check notes or content (for journals/fasting)
            if (data.notes?.toLowerCase().includes("amazing") || data.content?.toLowerCase().includes("amazing")) {
                console.log("MATCH FOUND:");
                console.log("ID:", doc.id);
                console.log("Type:", data.type);
                console.log("isDeleted:", data.isDeleted);
                console.log("userId:", data.userId);
                console.log("DeletedAt:", data.deletedAt);
                console.log("Full Data:", JSON.stringify(data));
                found = true;
            }
        });

        if (!found) {
            console.log("No entry with 'amazing' found in 'entries' collection.");
            // Maybe check other collections?
            const collections = ["fasting", "sessions", "journals"]; // common fallbacks
            for (const coll of collections) {
                const collSnap = await db.collection(coll).get();
                console.log(`Checking collection '${coll}' (${collSnap.size} docs)...`);
                collSnap.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.notes?.toLowerCase().includes("amazing") || data.content?.toLowerCase().includes("amazing")) {
                        console.log(`MATCH FOUND in '${coll}':`);
                        console.log("ID:", doc.id);
                        console.log("Data:", JSON.stringify(data));
                        found = true;
                    }
                });
            }
        }

        if (!found) {
            console.log("Entry STILL not found. It might have been hard-deleted.");
        }

    } catch (error) {
        console.error("Search failed:", error);
    }
}

findEntry();
