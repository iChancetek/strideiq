import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

const deleteActivitySchema = z.object({
    userId: z.string().min(1),
    activityId: z.string().min(1),
});

export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        const validation = deleteActivitySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const { userId, activityId } = validation.data;

        const docRef = adminDb.collection("users").doc(userId).collection("activities").doc(activityId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        const activity = docSnap.data()!;

        // Delete the document
        await docRef.delete();

        // Decrement aggregated stats
        try {
            const dateObj = activity.date?.toDate ? activity.date.toDate() : new Date(activity.date);
            const monthKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, "0")}`;

            // Decrement all-time stats
            const allTimeRef = adminDb.collection("users").doc(userId).collection("stats").doc("allTime");
            await allTimeRef.set({
                totalMiles: FieldValue.increment(-(activity.distance || 0)),
                totalRuns: FieldValue.increment(-1),
                totalTime: FieldValue.increment(-(activity.duration || 0)),
                lastUpdated: FieldValue.serverTimestamp(),
            }, { merge: true });

            // Decrement monthly stats
            const monthlyRef = adminDb.collection("users").doc(userId).collection("stats").doc(monthKey);
            await monthlyRef.set({
                totalMiles: FieldValue.increment(-(activity.distance || 0)),
                totalRuns: FieldValue.increment(-1),
                totalTime: FieldValue.increment(-(activity.duration || 0)),
                lastUpdated: FieldValue.serverTimestamp(),
            }, { merge: true });
        } catch (statsErr) {
            console.error("Stats decrement failed (non-fatal):", statsErr);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Activity Delete Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
