import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

async function run() {
    console.log("Loading firebase...");
    const { adminDb } = await import("../src/lib/firebase/admin");

    try {
        console.log("Querying deleted entries...");
        const snapshot = await adminDb.collection("entries")
            .where("isDeleted", "==", true)
            .get();
        
        console.log(`Total Deleted Entries found: ${snapshot.size}`);

        let count = 0;
        for (const doc of snapshot.docs) {
            const data = doc.data();
            console.log(`[Entry] ID: ${doc.id} | Type: ${data.type} | Dist: ${data.distance} | Dur: ${data.duration} | Date: ${data.date?.toDate?.() || data.createdAt?.toDate?.() || "N/A"}`);
            count++;
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
    process.exit(0);
}
run();
