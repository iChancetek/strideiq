// Check what's actually in Firestore using firebase-admin SDK directly
const fs = require('fs');
const admin = require('firebase-admin');

const keyFile = 'c:\\Users\\chanc\\Downloads\\strideiq-221-firebase-adminsdk-fbsvc-3be5e649d1.json';
const keyObj = JSON.parse(fs.readFileSync(keyFile, 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: keyObj.project_id,
        privateKey: keyObj.private_key,
        clientEmail: keyObj.client_email
    }),
    projectId: keyObj.project_id
});

const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore(admin.app(), 'default');

async function checkData() {
    console.log("=== Checking Firestore data ===\n");

    // Check entries collection
    console.log("--- entries collection ---");
    const entriesSnap = await db.collection('entries').limit(20).get();
    console.log(`Total docs: ${entriesSnap.size}`);
    entriesSnap.docs.forEach(d => {
        const data = d.data();
        console.log(`  [${d.id}] type="${data.type}" userId="${data.userId?.substring(0,12)}..." createdAt="${data.createdAt}"`);
    });

    // Check users collection 
    console.log("\n--- users collection ---");
    const usersSnap = await db.collection('users').limit(10).get();
    console.log(`Total docs: ${usersSnap.size}`);
    usersSnap.docs.forEach(d => {
        const data = d.data();
        console.log(`  [${d.id}]`, JSON.stringify(data).substring(0, 100));
    });

    // Check trainingPlans collection
    console.log("\n--- trainingPlans collection ---");
    const plansSnap = await db.collection('trainingPlans').limit(5).get();
    console.log(`Total docs: ${plansSnap.size}`);
}

checkData().then(() => process.exit(0)).catch(e => { console.error("ERROR:", e.message); process.exit(1); });
