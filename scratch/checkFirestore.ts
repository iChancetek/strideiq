import { config } from 'dotenv';
config({path: '.env.local'});
import * as admin from 'firebase-admin';

let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '';
let parsedKey;
try {
    if (key.startsWith("{")) {
        parsedKey = JSON.parse(key);
    } else if (key.startsWith('"')) {
        parsedKey = JSON.parse(JSON.parse(key)); 
    } else {
        throw new Error("Format unknown");
    }
} catch (e) {
    console.error("Parse Error:", e);
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: parsedKey.project_id,
        privateKey: parsedKey.private_key.replace(/\\n/g, '\n'),
        clientEmail: parsedKey.client_email
    })
});

console.log("Connecting to Project:", parsedKey.project_id);

async function check() {
    try {
        const db = admin.firestore();
        const docs = await db.collection("users").limit(1).get()
        console.log("DB SUCCESS, docs found:", docs.size);
    } catch (e) {
        console.error("REST API ERROR:", e);
    }
}
check();
