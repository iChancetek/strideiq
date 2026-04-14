const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
db.settings({ databaseId: 'default' });

async function fixFastingData() {
    console.log("=== Repairing Fasting History ===");
    const userId = "7veZQx0WFNaTAjxQRYnTfqgfFKF2";
    
    // 1. Delete the incorrect duplicates
    const idsToDelete = ["wXeV0CXclUVR9uFgcA6n", "VPEdfjoClNWXIBGYlXvJ"];
    for (const id of idsToDelete) {
        await db.collection('entries').doc(id).delete();
        console.log(`Deleted incorrect entry: ${id}`);
    }

    // 2. Create the correct 45.6 hour fast
    // Start: April 13, 2026, 12:24 AM (Local) -> April 13, 04:24 AM UTC
    // End: April 14, 2026, 10:00 PM (Local) -> April 15, 02:00 AM UTC
    const startTime = new Date("2026-04-13T04:24:00Z");
    const endTime = new Date("2026-04-15T02:00:00Z");
    const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

    const newEntry = {
        userId,
        type: "Fasting",
        startTime: admin.firestore.Timestamp.fromDate(startTime),
        endTime: admin.firestore.Timestamp.fromDate(endTime),
        duration: durationSeconds,
        goal: 24, // Assumed goal since it's long
        notes: "I feel amazing... (Restored precise 45h fasting session)",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        date: admin.firestore.Timestamp.fromDate(startTime),
        isDeleted: false,
        activityType: "fasting"
    };

    const docRef = await db.collection('entries').add(newEntry);
    console.log(`Successfully created accurate 45.6h fasting entry: ${docRef.id}`);
}

fixFastingData();
