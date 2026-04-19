import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

async function run() {
    const { adminDb } = await import("../src/lib/firebase/admin");

    try {
        console.log("Fetching journal entries directly...");
        const snapshot = await adminDb.collection("entries")
            .where("type", "==", "journal")
            .get();
            
        console.log("Total entries found:", snapshot.size);
        for (const doc of snapshot.docs) {
            const data = doc.data();
            console.log(`- ID: ${doc.id}, Date: ${data.date?.toDate?.() || data.date}, Content: ${data.content || data.notes}, isDeleted: ${data.isDeleted}`);
        }
    } catch (e) {
        console.error("Failed to fetch entries", e);
    }
}

run();
