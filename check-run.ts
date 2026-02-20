import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./service-account.json', 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function check() {
    // First, find the user ID for Chancellor@ichancetek.com
    const usersSnap = await db.collection("users").where("email", "==", "Chancellor@ichancetek.com").get();
    if (usersSnap.empty) {
        // try lowercase
        const usersSnap2 = await db.collection("users").where("email", "==", "chancellor@ichancetek.com").get();
        if (usersSnap2.empty) {
            console.log("User not found!");
            return;
        } else {
            const uid = usersSnap2.docs[0].id;
            console.log("Found user UID:", uid);
            await queryActivities(uid);
        }
    } else {
        const uid = usersSnap.docs[0].id;
        console.log("Found user UID:", uid);
        await queryActivities(uid);
    }
}

async function queryActivities(uid: string) {
    const activitiesSnap = await db.collection("users").doc(uid).collection("activities")
        .orderBy("date", "desc")
        .limit(10)
        .get();

    console.log(`Found ${activitiesSnap.size} recent activities.`);
    activitiesSnap.forEach(doc => {
        const data = doc.data();
        console.log(`- ${doc.id}: ${data.distance} miles, ${data.duration} seconds, Type: ${data.type}, Date: ${data.date.toDate()}`);
    });
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
