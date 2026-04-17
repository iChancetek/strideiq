import { NextResponse } from "next/server";
import { createActivitySchema } from "@/lib/validators/activity";
import { updateUserStats } from "@/lib/server/activity-service";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { headers } from "next/headers";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const body = await req.json();

        // Extract optional idempotency key (client-generated UUID to prevent duplicate saves on retry)
        const idempotencyKey = body.idempotencyKey as string | undefined;

        // Validate
        const validation = createActivitySchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Invalid activity data", details: validation.error.flatten() }, { status: 400 });
        }

        const activityData = validation.data;
        const activityDate = new Date(activityData.date);

        // ── Idempotency check: if this key was already used, return the existing doc ──
        if (idempotencyKey) {
            const existing = await adminDb.collection("entries")
                .where("userId", "==", userId)
                .where("idempotencyKey", "==", idempotencyKey)
                .limit(1)
                .get();
            if (!existing.empty) {
                const existingId = existing.docs[0].id;
                console.log(`[IDEMPOTENT_HIT] Returning existing activity ${existingId} for key ${idempotencyKey}`);
                return NextResponse.json({ success: true, activityId: existingId, deduplicated: true });
            }
        }

        // Calculate pace (seconds per mile)
        const pace = activityData.distance > 0
            ? (activityData.duration / activityData.distance)
            : 0;
        const paceMin = Math.floor(pace / 60);
        const paceSec = Math.floor(pace % 60);
        const paceStr = `${paceMin}:${paceSec < 10 ? "0" : ""}${paceSec}`;

        // Ensure the parent user doc exists (prevents NOT_FOUND)
        await adminDb.collection("users").doc(userId).set({ uid: userId }, { merge: true });

        // Save to top-level 'entries' collection (standardized timeline structure)
        const docRef = await adminDb.collection("entries")
            .add({
                ...activityData,
                userId,
                date: Timestamp.fromDate(activityDate),
                createdAt: Timestamp.now(),
                isDeleted: false,
                pace: paceStr,
                type: activityData.type || "Run",
                ...(idempotencyKey ? { idempotencyKey } : {}),
            });

        // Update aggregate stats (non-fatal: activity is already saved)
        try {
            await updateUserStats(userId, {
                ...activityData,
                date: activityDate,
            });
        } catch (statsErr: any) {
            // Stats update failed but the activity was created — do NOT fail the request.
            // Stats can be recalculated; losing the user's activity data cannot be recovered.
            console.error(`[STATS_UPDATE_FAILED] Activity ${docRef.id} saved, but stats update failed:`, statsErr.message);
        }

        return NextResponse.json({ success: true, activityId: docRef.id });

    } catch (error: any) {
        console.error("Activity Creation Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
