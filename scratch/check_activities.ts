import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

async function run() {
    const { adminDb } = await import("../src/lib/firebase/admin");

    try {
        console.log("Fetching non-deleted entries...");
        const snapshot = await adminDb.collection("entries")
            .where("isDeleted", "!=", true)
            .get();
            
        console.log(`Found ${snapshot.docs.length} total entries.`);
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            console.log(`  - ID: ${doc.id}, Type: ${data.type}, Dist: ${data.distance}, Dur: ${data.duration}, isDeleted: ${data.isDeleted}`);
        }
    } catch (e) {
        console.error(e);
    }
}

run();
