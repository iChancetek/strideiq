import { NextResponse } from "next/server";
import { createActivitySchema } from "@/lib/validators/activity";
import { updateUserStats } from "@/lib/server/activity-service";
import { db } from "@/db";
import { activities, users } from "@/db/schema";
import { supabase } from "@/lib/supabase";

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

        // Calculate pace (seconds per mile) - purely for returning to frontend if needed
        const pace = activityData.distance > 0
            ? (activityData.duration / activityData.distance)
            : 0;
        const paceMin = Math.floor(pace / 60);
        const paceSec = Math.floor(pace % 60);
        const paceStr = `${paceMin}:${paceSec < 10 ? "0" : ""}${paceSec}`;

        // Ensure user exists (in PG we need foreign key satisfaction)
        // Upsert standard user profile data in case this is their first API call after Auth
        await db.insert(users).values({
            id: userId,
            email: "user@example.com", // Fallback for schema requirement if not provided
        }).onConflictDoNothing();

        const newId = crypto.randomUUID();

        // Insert into Neon Postgres
        await db.insert(activities).values({
            id: newId,
            userId: userId,
            type: activityData.type,
            distance: activityData.distance,
            duration: activityData.duration,
            calories: activityData.calories || 0,
            notes: activityData.notes || null,
            date: activityDate,
            mode: (activityData as any).mode || null,
            environment: (activityData as any).environment || null,
            mileSplits: (activityData as any).mileSplits || null,
            pausedDuration: (activityData as any).pausedDuration || 0,
            weatherSnapshot: (activityData as any).weatherSnapshot || null,
            path: (activityData as any).path || null,
            steps: activityData.steps || 0,
            media: (activityData as any).media || null,
            aiAnalysis: (activityData as any).aiAnalysis || null,
            title: (activityData as any).title || null,
            fastingSessionId: (activityData as any).fastingSessionId || null,
        });

        // Update aggregate stats (Leaderboards, etc)
        await updateUserStats(userId, {
            ...activityData,
            date: activityDate,
        });

        // Broadcast to Supabase for Realtime Feeds
        if (supabase) {
            await supabase.channel(`user:${userId}`).send({
                type: 'broadcast',
                event: 'activity-created',
                payload: {
                    id: newId,
                    type: activityData.type,
                    distance: activityData.distance,
                    duration: activityData.duration,
                    date: activityDate
                }
            });
        }

        return NextResponse.json({ success: true, activityId: newId });

    } catch (error: any) {
        console.error("=== Activity Creation Error ===");
        console.error("Message:", error.message);
        
        return NextResponse.json({ 
            error: error.message || "Internal Server Error"
        }, { status: 500 });
    }
}
