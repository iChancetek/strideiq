import * as admin from 'firebase-admin';
import * as fs from 'fs';

async function test() {
    try {
        const key = fs.readFileSync('C:\\Users\\chanc\\Downloads\\strideiq-221-firebase-adminsdk-fbsvc-fdb9ac2388.json', 'utf8');
        const serviceAccount = JSON.parse(key);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: 'strideiq-221'
        });

        const adminDb = admin.firestore();

        console.log("Saving mock entry...");
        const docRef = await adminDb.collection("entries").add({
            test: "data"
        });
        console.log("Saved!", docRef.id);
        
        await docRef.delete();
        console.log("Deleted!");
    } catch (e: any) {
        console.error("ERROR CAUGHT:");
        console.error(e.message);
        console.error(e);
    }
}

test();
