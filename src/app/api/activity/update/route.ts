import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { z } from "zod";

const updateActivitySchema = z.object({
    userId: z.string().min(1),
    activityId: z.string().min(1),
    distance: z.number().min(0).optional(),
    duration: z.number().min(0).optional(), // seconds
    calories: z.number().min(0).optional(),
    notes: z.string().optional(),
    type: z.enum(["Run", "Walk", "Bike", "Treadmill", "HIIT"]).optional(),
});

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const validation = updateActivitySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: "Invalid data", details: validation.error.flatten() }, { status: 400 });
        }

        const { userId, activityId, ...updates } = validation.data;

        // Build the update object — only include provided fields
        const updateData: Record<string, any> = {};
        if (updates.distance !== undefined) updateData.distance = updates.distance;
        if (updates.duration !== undefined) updateData.duration = updates.duration;
        if (updates.calories !== undefined) updateData.calories = updates.calories;
        if (updates.notes !== undefined) updateData.notes = updates.notes;
        if (updates.type !== undefined) updateData.type = updates.type;

        // Recalculate pace if distance or duration changed
        const docRef = adminDb.collection("users").doc(userId).collection("activities").doc(activityId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        const existing = docSnap.data()!;
        const finalDistance = updateData.distance ?? existing.distance;
        const finalDuration = updateData.duration ?? existing.duration;

        if (finalDistance > 0) {
            const pace = finalDuration / finalDistance; // seconds per mile
            const paceMin = Math.floor(pace / 60);
            const paceSec = Math.floor(pace % 60);
            updateData.pace = `${paceMin}:${paceSec < 10 ? "0" : ""}${paceSec}`;
        }

        await docRef.update(updateData);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Activity Update Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
