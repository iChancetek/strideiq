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

async function restoreCorrectedFast() {
    const userId = "7veZQx0WFNaTAjxQRYnTfqgfFKF2";
    
    // 4/13/2026 at 12:34 AM
    // Since local time is 2:56 AM EDT (UTC-4) on 4/14, 
    // 12:34 AM on 4/13 in UTC is 4:34 AM 4/13.
    const startTime = new Date("2026-04-13T04:34:00Z"); 
    
    // Ended around 10 PM (4/13)
    // 10:00 PM on 4/13 in UTC is 2:00 AM 4/14.
    const endTime = new Date("2026-04-14T02:00:00Z");

    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    console.log(`Restoring session for user ${userId}...`);
    console.log(`Start: ${startTime.toISOString()}`);
    console.log(`End: ${endTime.toISOString()}`);
    console.log(`Duration: ${durationMinutes} minutes`);

    try {
        // Add to main entries
        const docRef = await db.collection("entries").add({
            userId,
            type: "Fasting",
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: durationMinutes,
            date: startTime, // Legacy date field for list sorting
            goal: 18,
            notes: "I feel amazing… ",
            isDeleted: false,
            createdAt: FieldValue.serverTimestamp()
        });

        console.log("SUCCESS! Restored to history with corrected times.");
        console.log("Entry ID:", docRef.id);
    } catch (e) {
        console.error("Restoration failed:", e);
    }
}

restoreCorrectedFast();
