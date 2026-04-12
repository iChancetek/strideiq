// Test the exact same parsing logic as admin.ts uses
const fs = require('fs');
const dotenv = require('dotenv');

// Parse .env.local exactly like Next.js does
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));

const key = envConfig.FIREBASE_SERVICE_ACCOUNT_KEY;
const projectId = envConfig.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

console.log("=== ENV VALUES ===");
console.log("Project ID:", JSON.stringify(projectId));
console.log("Key starts with:", JSON.stringify(key?.substring(0, 20)));
console.log("Key length:", key?.length);

// Attempt parse exactly like admin.ts
let parsedKey;
try {
    if (key.startsWith("{")) {
        parsedKey = JSON.parse(key);
        console.log("\n=== PARSE: Direct JSON.parse succeeded ===");
    } else if (key.startsWith('"')) {
        parsedKey = JSON.parse(JSON.parse(key));
        console.log("\n=== PARSE: Double JSON.parse succeeded ===");
    } else {
        console.error("Key format not recognized. First char code:", key.charCodeAt(0));
        process.exit(1);
    }
} catch (e) {
    console.error("\n=== PARSE FAILED ===");
    console.error("Error:", e.message);
    console.error("First 100 chars of key:", JSON.stringify(key.substring(0, 100)));
    process.exit(1);
}

console.log("Parsed project_id:", parsedKey.project_id);
console.log("Parsed client_email:", parsedKey.client_email);
console.log("Private key starts:", parsedKey.private_key?.substring(0, 40));

// Now try initializing Firebase Admin
const admin = require('firebase-admin');

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: parsedKey.project_id || projectId,
            privateKey: parsedKey.private_key.replace(/\\n/g, '\n'),
            clientEmail: parsedKey.client_email
        }),
        projectId: projectId,
    });
    console.log("\n=== Firebase Admin initialized successfully ===");
} catch(e) {
    console.error("\n=== Firebase Admin init FAILED ===");
    console.error(e.message);
    process.exit(1);
}

// Try a Firestore read
console.log("\n=== Testing Firestore read... ===");
admin.firestore().collection('users').limit(1).get()
    .then(snap => {
        console.log("SUCCESS! Found", snap.size, "documents");
        process.exit(0);
    })
    .catch(e => {
        console.error("FIRESTORE ERROR:", e.message);
        console.error("Full error:", e);
        process.exit(1);
    });
