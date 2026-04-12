import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
config({ path: '.env.local' });

let keyString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
if (keyString.startsWith('"') && keyString.endsWith('"')) {
    keyString = JSON.parse(keyString); 
}
const key = typeof keyString === 'string' ? JSON.parse(keyString) : keyString;
if (key.private_key) key.private_key = key.private_key.replace(/\\n/g, '\n').replace(/\\\\n/g, '\n');

initializeApp({
    credential: cert(key),
    projectId: 'strideiq-221'
});

const db = getFirestore();

async function findUser() {
    console.log("[DIAG] Finding user...");
    const snapshot = await db.collection("users").limit(1).get();
    if (snapshot.empty) {
        console.log("No users found.");
        return;
    }
    const user = snapshot.docs[0];
    console.log(`[USER_FOUND] UID: ${user.id}, Email: ${user.data().email}`);
}

findUser().catch(console.error);
