import { NextResponse } from "next/server";
import { db } from "@/db";
import { activities, leaderboards } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
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

        // Fetch activity before deleting to adjust stats
        const [activity] = await db.select().from(activities).where(
            and(eq(activities.id, activityId), eq(activities.userId, userId))
        );

        if (!activity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        // Delete the document
        await db.delete(activities).where(
            and(eq(activities.id, activityId), eq(activities.userId, userId))
        );

        // Decrement aggregated stats
        try {
            const dateObj = new Date(activity.date);
            const monthKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, "0")}`;

            await db.update(leaderboards)
                .set({
                    totalMiles: sql`${leaderboards.totalMiles} - ${activity.distance || 0}`,
                    totalRuns: sql`${leaderboards.totalRuns} - 1`,
                    totalTime: sql`${leaderboards.totalTime} - ${activity.duration || 0}`,
                    totalSteps: sql`${leaderboards.totalSteps} - ${activity.steps || 0}`
                })
                .where(
                    and(eq(leaderboards.userId, userId), eq(leaderboards.month, monthKey))
                );

        } catch (statsErr) {
            console.error("Stats decrement failed (non-fatal):", statsErr);
        }

        // Broadcast deleted event
        if (supabase) {
            try {
                await supabase.channel(`user:${userId}`).send({
                    type: 'broadcast',
                    event: 'activity-deleted',
                    payload: { id: activityId }
                });
            } catch (pErr) {
                console.error("Supabase broadcast failed:", pErr);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Activity Delete Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
