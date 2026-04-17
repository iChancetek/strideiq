import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

async function run() {
    const { adminDb } = await import("../src/lib/firebase/admin");
    const { decrementUserStats } = await import("../src/lib/server/activity-service");

    try {
        console.log("Fetching all entries...");
        const snapshot = await adminDb.collection("entries")
            .where("isDeleted", "!=", true)
            .get();
            
        const entries = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAtDate: doc.data().createdAt?.toDate?.() || new Date(0)
        }));

        // Sort by createdAt ascending
        entries.sort((a, b) => a.createdAtDate.getTime() - b.createdAtDate.getTime());
        
        const byUser = new Map<string, any[]>();
        entries.forEach(entry => {
            const userId = entry.userId;
            if (!userId) return;
            if (!byUser.has(userId)) byUser.set(userId, []);
            byUser.get(userId)!.push(entry);
        });

        for (const [userId, userEntries] of byUser.entries()) {
            // Check for potential duplicates (similar distance and duration)
            const seen = new Map<string, any[]>();
            const duplicatesToKill = [];
            
            for (const entry of userEntries) {
                const distRounded = Math.round((Number(entry.distance) || 0) * 10);
                const type = (entry.type || "Run").toLowerCase();
                const durRounded = Math.round((Number(entry.duration) || 0) / 10);
                
                // We IGNORE date because the user retried hours later. 
                // A duplicate is the same type/distance/duration
                const fingerprint = `${type}|${distRounded}|${durRounded}`;
                
                // Exempt 0/0 entries like empty journals from aggressive dedupe
                if (distRounded === 0 && durRounded === 0) continue;

                if (!seen.has(fingerprint)) {
                    seen.set(fingerprint, [entry]);
                } else {
                    seen.get(fingerprint)!.push(entry);
                    duplicatesToKill.push(entry);
                }
            }
            
            if (duplicatesToKill.length > 0) {
                console.log(`\nDeleting ${duplicatesToKill.length} duplicates for user ${userId}...`);
                const batch = adminDb.batch();
                let count = 0;

                for (const dup of duplicatesToKill) {
                    console.log(`  Deleting -> ID: ${dup.id}, Type: ${dup.type}, Dist: ${dup.distance}, Dur: ${dup.duration}`);
                    batch.update(adminDb.collection("entries").doc(dup.id), { isDeleted: true });
                    count++;
                }

                await batch.commit();

                // Decrement stats
                for (const dup of duplicatesToKill) {
                    try {
                        await decrementUserStats(userId, dup);
                    } catch (e) {
                         console.error(`Failed to decrement stats for ${dup.id}`);
                    }
                }
                console.log(`✅ Emptied ${count} duplicates from UI and fixed stats.`);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

run();
