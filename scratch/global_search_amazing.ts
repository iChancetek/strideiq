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

async function globalSearch() {
    console.log("Global searching for 'amazing'...");
    const collections = [
        "entries", 
        "users", 
        "achievements", 
        "fasting_sessions", 
        "activity", 
        "journal", 
        "sessions",
        "deleted"
    ];

    for (const collName of collections) {
        console.log(`Searching collection: ${collName}`);
        try {
            const snapshot = await db.collection(collName).get();
            snapshot.docs.forEach(doc => {
                const data = JSON.stringify(doc.data());
                if (data.toLowerCase().includes("amazing")) {
                    console.log(`!! MATCH !! in '${collName}':`, doc.id);
                    console.log("Data:", data);
                }
            });

            // If users, check subcollections
            if (collName === "users") {
                console.log("Checking user subcollections...");
                for (const uDoc of snapshot.docs) {
                    const subColls = await uDoc.ref.listCollections();
                    for (const sc of subColls) {
                        const scSnap = await sc.get();
                        scSnap.docs.forEach(scDoc => {
                            const scData = JSON.stringify(scDoc.data());
                            if (scData.toLowerCase().includes("amazing")) {
                                console.log(`!! MATCH !! in 'users/${uDoc.id}/${sc.id}':`, scDoc.id);
                                console.log("Data:", scData);
                            }
                        });
                    }
                }
            }
        } catch (e) {
            console.log(`Failed to search collection '${collName}'`);
        }
    }
}

globalSearch();
