import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

async function run() {
    console.log("Loading firebase...");
    const { adminDb } = await import("../src/lib/firebase/admin");

    try {
        console.log("Querying entries...");
        const snapshot = await adminDb.collection("entries")
            .where("type", "==", "journal")
            .get();
        
        console.log(`Total Journals found: ${snapshot.size}`);

        for (const doc of snapshot.docs) {
            const data = doc.data();
            console.log(`[Journal] ID: ${doc.id} | isDeleted: ${data.isDeleted} | Content: ${data.content?.substring(0, 30)}...`);
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
    process.exit(0);
}
run();
