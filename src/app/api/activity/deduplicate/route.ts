import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { headers } from "next/headers";
import { decrementUserStats } from "@/lib/server/activity-service";

/**
 * POST /api/activity/deduplicate
 * 
 * Scans a user's activities and soft-deletes duplicates.
 * Two entries are considered duplicates if they share the same:
 *   - type, distance (±0.01 mi), duration (±5s), and date within a 5-minute window.
 * The oldest entry (earliest createdAt) is kept; newer duplicates are marked isDeleted.
 */
export async function POST(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        // Fetch all non-deleted entries for this user
        const snapshot = await adminDb.collection("entries")
            .where("userId", "==", userId)
            .where("isDeleted", "!=", true)
            .get();

        if (snapshot.empty) {
            return NextResponse.json({ message: "No activities found", removed: 0 });
        }

        // Build a list of all entries with their data
        const entries = snapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(0),
        }));

        // Sort by createdAt ascending (oldest first — we keep the oldest)
        entries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

        // Group by fingerprint: type + rounded distance + rounded duration + 5-min date window
        const seen = new Map<string, typeof entries[0]>();
        const duplicates: typeof entries = [];

        for (const entry of entries) {
            const d = entry.data;
            const dateMs = d.date?.toDate?.()?.getTime?.() || new Date(d.date).getTime() || 0;
            // Round date to 5-minute windows
            const dateWindow = Math.floor(dateMs / (5 * 60 * 1000));
            // Round distance to 0.01
            const distRounded = Math.round((Number(d.distance) || 0) * 100);
            // Round duration to 5s
            const durRounded = Math.round((Number(d.duration) || 0) / 5);
            const type = (d.type || "Run").toLowerCase();

            const fingerprint = `${type}|${distRounded}|${durRounded}|${dateWindow}`;

            if (seen.has(fingerprint)) {
                // This is a duplicate — mark for deletion
                duplicates.push(entry);
            } else {
                seen.set(fingerprint, entry);
            }
        }

        if (duplicates.length === 0) {
            return NextResponse.json({ message: "No duplicates found", removed: 0 });
        }

        console.log(`[DEDUPLICATE] Found ${duplicates.length} duplicate(s) for user ${userId}`);

        // Batch: soft-delete duplicates and decrement stats
        const BATCH_LIMIT = 400; // Firestore batch limit is 500; leave headroom
        let processed = 0;
        
        for (let i = 0; i < duplicates.length; i += BATCH_LIMIT) {
            const chunk = duplicates.slice(i, i + BATCH_LIMIT);
            const batch = adminDb.batch();

            for (const dup of chunk) {
                batch.update(adminDb.collection("entries").doc(dup.id), { isDeleted: true });
            }

            await batch.commit();

            // Decrement stats for each deleted duplicate (outside batch since it's transactional)
            for (const dup of chunk) {
                try {
                    await decrementUserStats(userId, dup.data);
                } catch (err) {
                    console.error(`[DEDUPLICATE] Failed to decrement stats for ${dup.id}:`, err);
                    // Non-fatal — continue processing
                }
            }

            processed += chunk.length;
        }

        console.log(`[DEDUPLICATE] Removed ${processed} duplicate(s) for user ${userId}`);
        
        return NextResponse.json({
            success: true,
            removed: processed,
            duplicateIds: duplicates.map(d => d.id),
            message: `Removed ${processed} duplicate activit${processed === 1 ? 'y' : 'ies'}.`,
        });

    } catch (error: any) {
        console.error("[DEDUPLICATE_ERROR]:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
