import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

async function run() {
    const { adminDb } = await import("../src/lib/firebase/admin");
    try {
        console.log("Fetching all entries...");
        const snapshot = await adminDb.collection("entries")
            .where("isDeleted", "!=", true)
            .get();
            
        console.log(`Found ${snapshot.docs.length} total entries.`);
        
        const byUser = new Map<string, any[]>();
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const userId = data.userId;
            if (!byUser.has(userId)) byUser.set(userId, []);
            byUser.get(userId)!.push({ id: doc.id, ...data });
        });

        for (const [userId, entries] of byUser.entries()) {
            console.log(`\nUser: ${userId} has ${entries.length} entries`);
            
            // Check for potential duplicates (similar distance and duration)
            const seen = new Map<string, any[]>();
            
            for (const entry of entries) {
                const distRounded = Math.round((Number(entry.distance) || 0) * 10);
                const type = (entry.type || "Run").toLowerCase();
                const durRounded = Math.round((Number(entry.duration) || 0) / 10);
                const fingerprint = `${type}|${distRounded}|${durRounded}`;
                
                if (!seen.has(fingerprint)) seen.set(fingerprint, []);
                seen.get(fingerprint)!.push(entry);
            }
            
            for (const [fingerprint, group] of seen.entries()) {
                if (group.length > 1) {
                    console.log(`\nFound group of ${group.length} duplicates for fingerprint: ${fingerprint}`);
                    group.forEach(g => {
                        console.log(`  - ID: ${g.id}, Type: ${g.type}, Dist: ${g.distance}, Dur: ${g.duration}, Date: ${g.date?.toDate?.() ? g.date.toDate() : g.date}`);
                    });
                }
            }
        }
    } catch (e) {
        console.error(e);
    }
}

run();
