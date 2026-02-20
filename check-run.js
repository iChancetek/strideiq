require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, orderBy, limit, initializeFirestore } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });

async function check() {
    console.log("Looking for all users...");
    const usersRef = collection(db, "users");
    const usersSnap = await getDocs(usersRef);

    console.log(`Found ${usersSnap.size} user documents.`);
    let targetUids = [];

    usersSnap.forEach(doc => {
        const d = doc.data();
        if (d.email && d.email.toLowerCase() === "chancellor@ichancetek.com") {
            console.log(`MATCHED EMAIL: ${d.email} | UID: ${doc.id}`);
            targetUids.push(doc.id);
        }
    });

    if (targetUids.length === 0) {
        console.log("No users found matching that email.");
        return;
    }

    // Check activities for all matched UIDs
    for (const uid of targetUids) {
        console.log(`\n--- Querying for UID: ${uid} ---`);
        const actsRef = collection(db, "users", uid, "activities");
        const q = query(actsRef, orderBy("date", "desc"), limit(10));
        const activitiesSnap = await getDocs(q);

        console.log(`Found ${activitiesSnap.size} recent activities.`);
        activitiesSnap.forEach(doc => {
            const data = doc.data();
            let d = data.date;
            if (d && d.toDate) d = d.toDate();
            console.log(`- ID: ${doc.id} | ${data.distance} miles | ${data.duration}s | Type: ${data.type} | Date: ${d}`);
        });
    }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
