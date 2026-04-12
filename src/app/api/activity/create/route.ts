import { NextResponse } from "next/server";
import { createActivitySchema } from "@/lib/validators/activity";
import { updateUserStats } from "@/lib/server/activity-service";
import { adminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const body = await req.json();

        // Validate
        const validation = createActivitySchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Invalid activity data", details: validation.error.flatten() }, { status: 400 });
        }

        const activityData = validation.data;
        const activityDate = new Date(activityData.date);

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
                pace: paceStr,
                type: activityData.type || "Run", // Default to Run if missing
            });

        // Update aggregate stats
        await updateUserStats(userId, {
            ...activityData,
            date: activityDate,
        });

        return NextResponse.json({ success: true, activityId: docRef.id });

    } catch (error: any) {
        console.error("Activity Creation Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
