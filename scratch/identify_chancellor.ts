import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'))
    });
}

async function identify() {
    const db = getFirestore(admin.app(), "default");
    const users = await db.collection("users").where("email", "==", "chancellor@ichancetek.com").get();
    
    if (users.empty) {
        console.log("No user found with email chancellor@ichancetek.com");
        return;
    }

    const u = users.docs[0];
    const uid = u.id;
    console.log(`Chancellor UID: ${uid}`);

    const entries = await db.collection("entries")
        .where("userId", "==", uid)
        .orderBy("date", "desc")
        .limit(20)
        .get();

    console.log(`Found ${entries.docs.length} recent entries.`);
    entries.docs.forEach(doc => {
        const d = doc.data();
        console.log(`[${d.type}] Dist: ${d.distance}, Date: ${d.date?.toDate?.() || d.date}`);
    });
}

identify();
