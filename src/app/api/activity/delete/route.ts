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
        // Decrement aggregated stats (Maintenance)
        // ────────────────────────────────────────────────────────────
        try {
            const dateObj = new Date(activity.date.toDate ? activity.date.toDate() : activity.date);
            const monthKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, "0")}`;

            const userDocRef = adminDb.collection("users").doc(userId);
            const allTimeRef = userDocRef.collection("stats").doc("allTime");
            const monthlyRef = userDocRef.collection("stats").doc(monthKey);

            await Promise.all([
                allTimeRef.set({
                    totalMiles: FieldValue.increment(-(activity.distance || 0)),
                    totalRuns: FieldValue.increment(-1),
                    totalTime: FieldValue.increment(-(activity.duration || 0)),
                    lastUpdated: FieldValue.serverTimestamp(),
                }, { merge: true }),
                monthlyRef.set({
                    totalMiles: FieldValue.increment(-(activity.distance || 0)),
                    totalRuns: FieldValue.increment(-1),
                    totalTime: FieldValue.increment(-(activity.duration || 0)),
                    lastUpdated: FieldValue.serverTimestamp(),
                }, { merge: true })
            ]);
        } catch (statsErr) {
            console.error("Stats decrement failed (non-fatal):", statsErr);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Activity Delete Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
