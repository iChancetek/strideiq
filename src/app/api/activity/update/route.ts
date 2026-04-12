import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { z } from "zod";

import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";

const updateActivitySchema = z.object({
    activityId: z.string().min(1),
    distance: z.number().min(0).optional(),
    duration: z.number().min(0).optional(),
    calories: z.number().min(0).optional(),
    notes: z.string().optional(),
    type: z.enum(["Run", "Walk", "Bike", "Hike", "Treadmill", "HIIT", "Meditation", "Fasting"]).optional(),
    media: z.array(z.object({
        type: z.enum(["image", "video"]),
        url: z.string(),
        path: z.string(),
        createdAt: z.string()
    })).optional(),
});

export async function PUT(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const body = await req.json();
        const validation = updateActivitySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: "Invalid data", details: validation.error.flatten() }, { status: 400 });
        }

        const { activityId, ...updates } = validation.data;
        const entryRef = adminDb.collection("entries").doc(activityId);
        const docSnap = await entryRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        const data = docSnap.data()!;
        if (data.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Standardize pace calculation if applicable
        const finalDistance = updates.distance ?? data.distance;
        const finalDuration = updates.duration ?? data.duration;
        let pace = data.pace;

        if (finalDistance > 0 && (updates.distance !== undefined || updates.duration !== undefined)) {
            const paceSecTotal = finalDuration / finalDistance;
            const mins = Math.floor(paceSecTotal / 60);
            const secs = Math.floor(paceSecTotal % 60);
            pace = `${mins}:${secs.toString().padStart(2, "0")}`;
        }

        await entryRef.update({
            ...updates,
            pace,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Activity Update Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
