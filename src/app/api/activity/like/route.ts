import { db } from "@/db";
import { likes, activities, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { activityId, userId, activityOwnerId } = body;

        if (!activityId || !userId) {
            return NextResponse.json({ error: "Missing activityId or userId" }, { status: 400 });
        }

        // 1. Check if user already liked this activity
        const existingLike = await db.query.likes.findFirst({
            where: and(eq(likes.activityId, activityId), eq(likes.userId, userId))
        });

        let isLiked = false;

        if (existingLike) {
            // 2a. Unlike: Delete like and decrement counter
            await db.transaction(async (tx) => {
                await tx.delete(likes).where(eq(likes.id, existingLike.id));
                await tx.update(activities)
                    .set({ likesCount: sql`${activities.likesCount} - 1` })
                    .where(eq(activities.id, activityId));
            });
            isLiked = false;
        } else {
            // 2b. Like: Add like and increment counter
            // Ensure user exists (foreign key)
            await db.insert(users).values({ id: userId, email: "user@example.com" }).onConflictDoNothing();
            
            await db.transaction(async (tx) => {
                await tx.insert(likes).values({
                    id: crypto.randomUUID(),
                    activityId,
                    userId
                });
                await tx.update(activities)
                    .set({ likesCount: sql`${activities.likesCount} + 1` })
                    .where(eq(activities.id, activityId));
            });
            isLiked = true;
        }

        // 3. Broadcast to Supabase
        if (supabase) {
            try {
                // Fetch updated like count and list of likers (simplified for now)
                const [activity] = await db.select({ likesCount: activities.likesCount })
                    .from(activities)
                    .where(eq(activities.id, activityId));

                await supabase.channel(`activity:${activityId}`).send({
                    type: 'broadcast',
                    event: 'like-toggled',
                    payload: {
                        activityId,
                        userId,
                        isLiked,
                        newCount: activity?.likesCount || 0
                    }
                });
            } catch (err) {
                console.error("[Supabase] Broadcast Failed:", err);
            }
        }

        return NextResponse.json({ success: true, isLiked });

    } catch (error: any) {
        console.error("Like Toggle Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
