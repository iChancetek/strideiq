import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";

const deleteActivitySchema = z.object({
    activityId: z.string().min(1),
});

export async function DELETE(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const body = await req.json();
        const validation = deleteActivitySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const { activityId } = validation.data;
        const entryRef = adminDb.collection("entries").doc(activityId);
        const docSnap = await entryRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        const activity = docSnap.data()!;
        if (activity.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Perform soft-delete
        await entryRef.update({ 
            isDeleted: true, 
            deletedAt: FieldValue.serverTimestamp() 
        });

        // ────────────────────────────────────────────────────────────
        // Decrement aggregated stats (Centralized)
        // ────────────────────────────────────────────────────────────
        const { decrementUserStats } = await import("@/lib/server/activity-service");
        await decrementUserStats(userId, activity);


        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Activity Delete Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
