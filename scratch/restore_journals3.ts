import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

async function run() {
    const { adminDb } = await import("../src/lib/firebase/admin");

    try {
        console.log("Fetching ALL journal entries...");
        // the client filters: type === 'journal' || type === 'Reflection' || type === 'Journal' || (!type && content);
        const snapshot = await adminDb.collection("entries").get();
                    
        const batch = adminDb.batch();
        let restoreCount = 0;
        const toRestore = [];
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const isJournalType = data.type === "journal" || data.type === "Reflection" || data.type === "Journal" || (!data.type && data.content);
            if (isJournalType && data.isDeleted === true) {
                // Ignore the 3 confirmed corrupt journals:
                if (doc.id === "d5eeefca-0886-4438-842f-36ddac679baa" || doc.id === "c05d4574-f3b9-45ff-ba09-49abea210cc7" || doc.id === "e5d7ad27-c34c-49f3-8de4-4025f4aa3e0f") {
                    continue; // Skip the ones we intentionally deleted
                }
                console.log(`Found deleted journal! ID: ${doc.id}, Title: ${data.title}`);
                toRestore.push(doc);
            }
        }
        
        for (const doc of toRestore) {
             batch.update(doc.ref, { isDeleted: false });
             restoreCount++;
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
