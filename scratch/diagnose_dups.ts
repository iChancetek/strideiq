import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'))
    });
}

const db = getFirestore(admin.app(), "default");

async function diagnose() {
    const users = await db.collection("users").where("email", "==", "chancellor@ichancetek.com").get();
    if (users.empty) return;
    const uid = users.docs[0].id;

    console.log(`[DIAGNOSE] Fetching entries for Chancellor...`);
    const snapshot = await db.collection("entries")
        .where("userId", "==", uid)
        .where("type", "==", "Walking") // User mentioned 🚶
        .get();

    console.log(`[DIAGNOSE] Found ${snapshot.size} walk/walking entries.`);

    snapshot.docs.forEach(doc => {
        const d = doc.data();
        // Log details of "Evening Walk"
        if (d.notes && d.notes.includes("Evening Walk") || d.mode === "Walking") {
             const dateStr = d.date?.toDate ? d.date.toDate().toISOString() : d.date;
             console.log(`ID: ${doc.id} | Date: ${dateStr} | Dist: ${d.distance} | Dur: ${d.duration} | Notes: ${d.notes}`);
        }
    });
}

diagnose().catch(console.error);
