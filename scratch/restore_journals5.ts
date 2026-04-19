import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

async function run() {
    const { adminDb } = await import("../src/lib/firebase/admin");

    try {
        console.log("Fetching ALL journal entries directly...");
        const snapshot = await adminDb.collection("entries")
            .where("type", "==", "journal")
            .get();
            
        console.log(`Found ${snapshot.size} total journals by type.`);
        
        const batch = adminDb.batch();
        let updatedCount = 0;
        
        for (const doc of snapshot.docs) {
             const data = doc.data();
             console.log(`Checking doc ${doc.id} - isDeleted is: ${data.isDeleted} (type: ${typeof data.isDeleted})`);
             batch.update(doc.ref, { "isDeleted": false });
             updatedCount++;
        }
        
        if (updatedCount > 0) {
            await batch.commit();
        }
        
        console.log(`Forced 'isDeleted': false on ${updatedCount} journals!`);
    } catch (e) {
        console.error("Failed to restore entries", e);
    }
}

run();
