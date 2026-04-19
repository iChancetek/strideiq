import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

async function run() {
    const { adminDb } = await import("../src/lib/firebase/admin");

    try {
        console.log("Fetching journal entries to restore...");
        const snapshot = await adminDb.collection("entries")
            .where("type", "==", "journal")
            .where("isDeleted", "==", true)
            .get();
            
        console.log(`Found ${snapshot.size} deleted journals. Restoring...`);
        
        const batch = adminDb.batch();
        let restoreCount = 0;
        
        for (const doc of snapshot.docs) {
            batch.update(doc.ref, { isDeleted: false });
            restoreCount++;
            
            if (restoreCount % 500 === 0) {
                await batch.commit();
                console.log(`Committed ${restoreCount} restorations...`);
            }
        }
        
        if (restoreCount % 500 !== 0) {
            await batch.commit();
        }
        
        console.log(`Successfully restored ${restoreCount} journals!`);
    } catch (e) {
        console.error("Failed to restore entries", e);
    }
}

run();
