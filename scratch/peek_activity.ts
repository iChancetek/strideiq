import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

async function run() {
    const { adminDb } = await import("../src/lib/firebase/admin");

    try {
        const snapshot = await adminDb.collection("entries")
            .where("isDeleted", "==", false)
            .get();
        
        let pathCount = 0;
        let splitsCount = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();
            if (data.path && data.path.length > 0) pathCount++;
            if (data.mileSplits && data.mileSplits.length > 0) splitsCount++;
        }
        
        console.log(`Total active entries: ${snapshot.size}`);
        console.log(`Entries with full path data: ${pathCount}`);
        console.log(`Entries with full mile_splits data: ${splitsCount}`);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
    process.exit(0);
}
run();
