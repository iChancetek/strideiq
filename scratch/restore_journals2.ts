import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

async function run() {
    const { adminDb } = await import("../src/lib/firebase/admin");

    try {
        console.log("Fetching ALL journal entries...");
        const snapshot = await adminDb.collection("entries")
            .where("type", "==", "journal")
            .get();
            
        console.log(`Found ${snapshot.size} total journals. Filtering for deleted...`);
        
        const batch = adminDb.batch();
        let restoreCount = 0;
        const toRestore = [];
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            if (data.isDeleted === true) {
                // Wait, if it's an empty duplicate let's NOT restore it if we know its ID.
                // But the user said "all journals", let's restore all for now. Or let's see.
                const isLiteralEmpty = !data.content && !data.title && !data.notes;
                
                toRestore.push(doc);
            }
        }
        
        console.log(`Found ${toRestore.length} deleted journals to restore. Restoring...`);

        for (const doc of toRestore) {
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
