import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

async function run() {
    const { adminDb } = await import("../src/lib/firebase/admin");

    try {
        console.log("Fetching journal entries...");
        const snapshot = await adminDb.collection("entries")
            .where("type", "==", "journal")
            .get();
            
        for (const doc of snapshot.docs) {
            const data = doc.data();
            console.log(`- ID: ${doc.id}, Date: ${data.date?.toDate?.() || data.date}, Content: ${data.content || data.notes}, isDeleted: ${data.isDeleted}`);

            // If it's literally an empty duplicate from today, let's mark it as deleted
            // Wait, let's just delete the 3 specific journal duplicate IDs I found earlier, or delete all empty ones.
            // Let's just output them first
        }

        // Just to be safe, I'm going to physically delete the 3 duplicate journal entries identified earlier:
        const toDeleteIds = ["d5eeefca-0886-4438-842f-36ddac679baa", "c05d4574-f3b9-45ff-ba09-49abea210cc7", "e5d7ad27-c34c-49f3-8de4-4025f4aa3e0f"];
        const batch = adminDb.batch();
        let deleted = 0;
        for (const id of toDeleteIds) {
             const docRef = adminDb.collection("entries").doc(id);
             const d = await docRef.get();
             if (d.exists && !d.data()?.isDeleted) {
                 batch.update(docRef, { isDeleted: true });
                 deleted++;
                 console.log("Deleted duplicate journal: " + id);
             }
        }
        if (deleted > 0) {
            await batch.commit();
            console.log(`Committed ${deleted} journal deletions.`);
        }

        
    } catch (e) {
        console.error(e);
    }
}

run();
