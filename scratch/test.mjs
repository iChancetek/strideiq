import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
config({ path: '.env.local' });

let key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
let cleanedKey = key.trim();
if (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) {
    cleanedKey = cleanedKey.slice(1, -1);
}
cleanedKey = cleanedKey.replace(/\\"/g, '"');
cleanedKey = cleanedKey.replace(/\r/g, '');
cleanedKey = cleanedKey.replace(/\n/g, '\\n');

let parsed = JSON.parse(cleanedKey);
if (parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
}

try {
    const app = initializeApp({
        credential: cert(parsed),
        projectId: 'strideiq-221'
    });
    console.log("Firebase App Initialized successfully!");
} catch(e) {
    console.error("Init Error:", e);
}
