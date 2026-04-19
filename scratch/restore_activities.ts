import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

async function run() {
    console.log("Loading firebase...");
    const { adminDb } = await import("../src/lib/firebase/admin");

    try {
        console.log("Restoring deleted entries...");
        const snapshot = await adminDb.collection("entries")
            .where("isDeleted", "==", true)
            .get();
        
        console.log(`Total Deleted Entries found: ${snapshot.size}`);

        const batch = adminDb.batch();
        let count = 0;
        for (const doc of snapshot.docs) {
            batch.update(doc.ref, { isDeleted: false });
            count++;
        }
        
        await batch.commit();
        console.log(`Successfully restored ${count} activities.`);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
    process.exit(0);
}
run();
