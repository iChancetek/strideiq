import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'))
    });
}

const db = getFirestore(admin.app(), "default");

async function listAll() {
    const users = await db.collection("users").where("email", "==", "chancellor@ichancetek.com").get();
    if (users.empty) return;
    const uid = users.docs[0].id;

    const snapshot = await db.collection("entries").where("userId", "==", uid).get();
    console.log(`[LIST] Total entries: ${snapshot.size}`);

    snapshot.docs.forEach(doc => {
        const d = doc.data();
        const dateStr = d.date?.toDate ? d.date.toDate().toISOString() : (d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.date);
        console.log(`ID: ${doc.id} | Type: ${d.type} | Date: ${dateStr} | Dist: ${d.distance} | Dur: ${d.duration} | Notes: ${d.notes}`);
    });
}

listAll().catch(console.error);
