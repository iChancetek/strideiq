import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

async function run() {
    const { adminDb } = await import("../src/lib/firebase/admin");

    try {
        console.log("Fetching ALL journal entries...");
        const snapshot = await adminDb.collection("entries").get();
                    
        const batch = adminDb.batch();
        let restoreCount = 0;
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const isJournal = data.type === 'journal' || data.type === 'Reflection' || data.type === 'Journal' || (!data.type && data.content);
            if (isJournal && data.isDeleted === true) {
                console.log(`Restoring journal ID: ${doc.id}`);
                batch.update(doc.ref, { isDeleted: false });
                restoreCount++;
            }
        }
        
        if (restoreCount > 0) {
            await batch.commit();
        }
        
        console.log(`Successfully restored ${restoreCount} journals!`);
    } catch (e) {
        console.error("Failed to restore entries", e);
    }
}

run();
