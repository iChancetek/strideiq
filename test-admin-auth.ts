import * as admin from 'firebase-admin';

async function testAuth() {
    try {
        console.log("Loading key...");
        const keyPath = 'C:\\Users\\chanc\\Downloads\\strideiq-221-firebase-adminsdk-fbsvc-30aba60bfa.json';
        const serviceAccount = require(keyPath);

        console.log("Initializing App...");
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log("Accessing DB...");
        const db = admin.firestore();

        console.log("Listing collections...");
        const collections = await db.listCollections();
        console.log("Collections:", collections.map(c => c.id));
        
        console.log("SUCCESS");
    } catch (e) {
        console.error("FAILED", e);
    }
}

testAuth();
