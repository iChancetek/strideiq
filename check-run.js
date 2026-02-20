require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function check() {
    console.log("Looking for user...");
    const usersSnap = await db.collection("users").where("email", "==", "chancellor@ichancetek.com").get();
    let uid = "bXQpE5oXo4Z0Xm9X2gZbM1rE2xU2"; // Fallback to a known dev UID if search fails, though it should be lowercase chancellor

    if (!usersSnap.empty) {
        uid = usersSnap.docs[0].id;
    } else {
        const usersSnap2 = await db.collection("users").where("email", "==", "Chancellor@ichancetek.com").get();
        if (!usersSnap2.empty) uid = usersSnap2.docs[0].id;
    }

    console.log("Querying for UID:", uid);

    // Check activities
    const activitiesSnap = await db.collection("users").doc(uid).collection("activities")
        .orderBy("date", "desc")
        .limit(10)
        .get();

    console.log(`Found ${activitiesSnap.size} recent activities.`);
    activitiesSnap.forEach(doc => {
        const data = doc.data();
        let d = data.date;
        if (d && d.toDate) d = d.toDate();
        console.log(`- ID: ${doc.id} | ${data.distance} miles | ${data.duration}s | Type: ${data.type} | Date: ${d}`);
    });
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
