import { db } from "@/db";
import { fastingSessions, users, activities } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    let userId: string | null = null;
    try {
        const { searchParams } = new URL(req.url);
        userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const [activeSession] = await db.select().from(fastingSessions)
            .where(and(eq(fastingSessions.userId, userId), eq(fastingSessions.status, "active")))
            .orderBy(desc(fastingSessions.startTime))
            .limit(1);

        return NextResponse.json({ activeSession: activeSession || null });

    } catch (error: any) {
        console.error("[FASTING_STATUS_GET_ERROR]", {
            message: error.message,
            stack: error.stack,
            userId
        });
        return NextResponse.json({ 
            error: "Failed to fetch fasting status", 
            details: error.message 
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    let userId: string | undefined;
    let action: string | undefined;

    try {
        const body = await req.json();
        userId = body.userId;
        action = body.action;
        const { goalHours, notes, media } = body;

        if (!userId || !action) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Ensure user exists - Explicitly target id for conflict
        await db.insert(users)
            .values({ id: userId, email: "user@example.com" })
            .onConflictDoNothing({ target: users.id });

        if (action === "start") {
            const newId = crypto.randomUUID();
            await db.insert(fastingSessions).values({
                id: newId,
                userId,
                startTime: new Date(),
                goal: goalHours || 16,
                status: "active"
            });
        } else if (action === "stop") {
            const [activeSession] = await db.select().from(fastingSessions)
                .where(and(eq(fastingSessions.userId, userId), eq(fastingSessions.status, "active")))
                .orderBy(desc(fastingSessions.startTime))
                .limit(1);

            if (activeSession) {
                const endTime = new Date();
                const durationSeconds = Math.floor((endTime.getTime() - activeSession.startTime.getTime()) / 1000);
                
                await db.update(fastingSessions)
                    .set({
                        endTime,
                        duration: durationSeconds,
                        notes: notes || null,
                        media: media || null,
                        status: "completed"
                    })
                    .where(eq(fastingSessions.id, activeSession.id));

                const sessionId = activeSession.id;

                // Create a unified activity history record
                await db.insert(activities).values({
                    id: crypto.randomUUID(),
                    userId,
                    type: "Fasting",
                    distance: 0,
                    duration: durationSeconds,
                    calories: 0,
                    date: new Date(),
                    mode: "fasting",
                    notes: notes || `Fasting Session: ${Math.round(durationSeconds / 3600)} hours completed. Target was ${activeSession.goal}h.`,
                    media: media || null,
                    fastingSessionId: activeSession.id
                });

                // Trigger AI Analysis in background (don't await for faster response)
                fetch(`${req.url.split('/status')[0]}/analyze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId })
                }).catch(err => console.error("Fasting Analysis trigger failed:", err));
            }
        }

        // Broadcast to Supabase
        if (supabase) {
            try {
                await supabase.channel(`user:${userId}`).send({
                    type: 'broadcast',
                    event: 'fasting-status-changed',
                    payload: { action }
                });
            } catch (err) {
                console.error("[Supabase] Broadcast Failed:", err);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("[FASTING_STATUS_POST_ERROR]", {
            message: error.message,
            stack: error.stack,
            body: { userId, action }
        });
        return NextResponse.json({ 
            error: "Failed to update fasting status", 
            details: error.message 
        }, { status: 500 });
    }
}
