import * as admin from 'firebase-admin';
import * as fs from 'fs';

async function test() {
    try {
        const key = fs.readFileSync('C:\\Users\\chanc\\Downloads\\strideiq-221-firebase-adminsdk-fbsvc-30aba60bfa.json', 'utf8');
        const serviceAccount = JSON.parse(key);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: 'strideiq-221',
            databaseURL: "https://strideiq-221-default-rtdb.firebaseio.com" // Just in case
        });

        const adminDb = admin.firestore();

        console.log("Saving mock entry to 'entries' collection...");
        const docRef = await adminDb.collection("entries").add({
            test: "data",
            title: "Test Entry from Script",
            userId: "test_user_id"
        });
        console.log("Success! Saved document ID:", docRef.id);
        
        await docRef.delete();
        console.log("Document successfully deleted. Authentication and Database paths are correct.");
    } catch (e: any) {
        console.error("=== FIRESTORE ERROR ===");
        console.error("Message:", e.message);
        console.error("Code:", e.code);
        console.error("Details:", e.details);
    }
}

test();

