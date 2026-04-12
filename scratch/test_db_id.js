const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testConnection() {
  try {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    let serviceAccount;
    if (key.startsWith('{')) {
      serviceAccount = JSON.parse(key);
    } else if (key.startsWith('"')) {
      serviceAccount = JSON.parse(JSON.parse(key));
    } else if (key.startsWith("'")) {
       // Handle single quotes if present
       serviceAccount = JSON.parse(key.slice(1, -1));
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId
      });
    }

    console.log("Testing with ID 'default'...");
    try {
      const dbDefault = getFirestore(admin.app(), 'default');
      const snap = await dbDefault.collection('users').limit(1).get();
      console.log("Success with 'default'! Count:", snap.size);
    } catch (e) {
      console.error("Failed with 'default':", e.message);
    }

    console.log("\nTesting without ID (default)...");
    try {
      const dbNull = getFirestore(admin.app());
      const snap = await dbNull.collection('users').limit(1).get();
      console.log("Success without ID! Count:", snap.size);
    } catch (e) {
      console.error("Failed without ID:", e.message);
    }

  } catch (err) {
    console.error("Setup error:", err);
  }
}

testConnection();
