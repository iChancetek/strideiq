import { db } from "@/db";
import { trainingPlans, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const [plan] = await db.select().from(trainingPlans)
            .where(and(eq(trainingPlans.userId, userId), eq(trainingPlans.isActive, true)))
            .orderBy(desc(trainingPlans.updatedAt))
            .limit(1);

        if (!plan) {
             return NextResponse.json({ plan: null });
        }

        return NextResponse.json({ plan });

    } catch (error: any) {
        console.error("Training Plan Fetch Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, goal, startDate, raceDate, weeks } = body;

        if (!userId || !goal || !startDate || !raceDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Ensure user exists (foreign key)
        await db.insert(users).values({ id: userId, email: "user@example.com" }).onConflictDoNothing();

        // 1. Deactivate old plans
        await db.update(trainingPlans)
            .set({ isActive: false })
            .where(eq(trainingPlans.userId, userId));

        // 2. Insert new plan
        const newId = crypto.randomUUID();
        await db.insert(trainingPlans).values({
            id: newId,
            userId,
            goal,
            startDate: new Date(startDate),
            raceDate: new Date(raceDate),
            weeks: weeks || [],
            isActive: true
        });

        // 3. Broadcast to Supabase
        if (supabase) {
            try {
                await supabase.channel(`user:${userId}`).send({
                    type: 'broadcast',
                    event: 'plan-updated',
                    payload: { planId: newId }
                });
            } catch (err) {
                console.error("[Supabase] Broadcast Failed:", err);
            }
        }

        return NextResponse.json({ success: true, planId: newId });

    } catch (error: any) {
        console.error("Training Plan Update Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
