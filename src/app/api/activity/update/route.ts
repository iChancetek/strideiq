import { NextResponse } from "next/server";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ablyRest } from "@/lib/ably";
import { z } from "zod";

const updateActivitySchema = z.object({
    userId: z.string().min(1),
    activityId: z.string().min(1),
    distance: z.number().min(0).optional(),
    duration: z.number().min(0).optional(), // seconds
    calories: z.number().min(0).optional(),
    notes: z.string().optional(),
    type: z.enum(["Run", "Walk", "Bike", "Hike", "Treadmill", "HIIT"]).optional(),
    media: z.array(z.object({
        type: z.enum(["image", "video"]),
        url: z.string(),
        path: z.string(),
        createdAt: z.string()
    })).optional(),
});

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const validation = updateActivitySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: "Invalid data", details: validation.error.flatten() }, { status: 400 });
        }

        const { userId, activityId, ...updates } = validation.data;

        // Fetch existing activity
        const [activity] = await db.select().from(activities).where(
            and(eq(activities.id, activityId), eq(activities.userId, userId))
        );

        if (!activity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        // Apply updates
        await db.update(activities)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .where(
                and(eq(activities.id, activityId), eq(activities.userId, userId))
            );

        // Notify real-time listeners
        if (ablyRest) {
            try {
                await ablyRest.channels.get(`user:${userId}`).publish('activity-updated', {
                    id: activityId,
                    ...updates
                });
            } catch (err) {
                console.error("Ably update silent failure:", err);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Activity Update Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
