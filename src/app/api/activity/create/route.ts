import { NextResponse } from "next/server";
import { createActivitySchema } from "@/lib/validators/activity";
import { updateUserStats } from "@/lib/server/activity-service";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Extract userId from body
        const { userId } = body;
        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 401 });
        }

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

        // Ensure the parent users/{uid} doc exists before writing to subcollections
        // This prevents NOT_FOUND errors for new users whose profile hasn't synced yet
        const userDocRef = adminDb.collection("users").doc(userId);
        await userDocRef.set({ uid: userId }, { merge: true });

        // Save using Admin SDK — bypasses client auth rules
        const docRef = await userDocRef
            .collection("activities")
            .add({
                ...activityData,
                date: Timestamp.fromDate(activityDate),
                createdAt: Timestamp.now(),
                pace: paceStr,
            });

        // Update aggregate stats
        await updateUserStats(userId, {
            ...activityData,
            date: activityDate,
        });

        return NextResponse.json({ success: true, activityId: docRef.id });

    } catch (error: any) {
        console.error("=== Activity Creation Error ===");
        console.error("Error Code:", error.code);
        console.error("Error Details:", error.details);
        console.error("Error Message:", error.message);
        
        return NextResponse.json({ 
            error: error.message || "Internal Server Error",
            code: error.code,
            details: error.details
        }, { status: 500 });
    }
}
