import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

async function run() {
    const { adminDb } = await import("../src/lib/firebase/admin");

    try {
        const snapshot = await adminDb.collection("entries")
            .where("type", "==", "journal")
            .get();
        
        console.log(`Found ${snapshot.size} total journals.`);
        for (const doc of snapshot.docs) {
            const data = doc.data();
            console.log(`ID: ${doc.id}, userId: ${data.userId}, isDeleted: ${data.isDeleted}`);
        }
    } catch (e) {
        console.error(e);
    }
}
run();
