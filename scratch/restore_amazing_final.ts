import { config } from 'dotenv';
config({ path: '.env.local' });
import * as admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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

async function restoreAmazingSession() {
    const userId = "7veZQx0WFNaTAjxQRYnTfqgfFKF2";
    const notes = "I feel amazing… ";
    const startTime = "2026-04-13T04:34:02.034Z";
    const endTime = "2026-04-14T02:12:17.235Z";
    const durationSeconds = 77895;

    console.log(`Restoring session for user ${userId} to Trash...`);

    try {
        const docRef = await db.collection("entries").add({
            userId,
            type: "Fasting",
            startTime,
            endTime,
            duration: Math.floor(durationSeconds / 60), // minutes
            date: new Date(startTime),
            goal: 18,
            notes,
            media: [],
            createdAt: new Date().toISOString(),
            isDeleted: true,
            deletedAt: FieldValue.serverTimestamp()
        });

        console.log("SUCCESS! Session restored as soft-deleted in 'entries' collection.");
        console.log("New Doc ID:", docRef.id);
    } catch (e) {
        console.error("Restoration failed:", e);
    }
}

restoreAmazingSession();
