import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import fs from 'fs';

console.log("[DIAG] Starting...");
const envPath = "d:/chancellor/strideiq/.env.local";
if (!fs.existsSync(envPath)) {
    console.error("[DIAG] .env.local not found at:", envPath);
    process.exit(1);
}

config({ path: envPath });

let keyStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!keyStr) {
    console.error("[DIAG] FIREBASE_SERVICE_ACCOUNT_KEY missing!");
    process.exit(1);
}

keyStr = keyStr.trim();
if (keyStr.startsWith('"') && keyStr.endsWith('"')) {
    keyStr = keyStr.substring(1, keyStr.length - 1);
}

// Liberal cleaning of escaped characters
const cleanKey = keyStr.replace(/\\"/g, '"').replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');

try {
    const key = JSON.parse(cleanKey);
    console.log("[DIAG] JSON Parse Success. Project in Key:", key.project_id);
    
    initializeApp({
        credential: cert(key),
        projectId: key.project_id
    });
    
    const db = getFirestore();
    console.log("[DIAG] Firestore Initialized. Fetching 'entries'...");
    
    const snap = await db.collection("entries").limit(5).get();
    console.log(`[DIAG] Found ${snap.size} entries.`);
    
    snap.docs.forEach(doc => {
        console.log(` - [${doc.id}] Type: ${doc.data().type}, User: ${doc.data().userId}`);
    });
    
} catch (e) {
    console.error("[DIAG] FAILED:", e);
}
