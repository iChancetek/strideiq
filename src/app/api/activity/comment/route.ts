import { db } from "@/db";
import { comments, users } from "@/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const activityId = searchParams.get("activityId");

        if (!activityId) {
            return NextResponse.json({ error: "Missing activityId" }, { status: 400 });
        }

        const activityComments = await db.select({
            id: comments.id,
            text: comments.content,
            userId: comments.userId,
            userName: users.displayName,
            userPhoto: users.photoURL,
            parentId: comments.parentId,
            createdAt: comments.createdAt
        }).from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.activityId, activityId))
        .orderBy(asc(comments.createdAt));

        return NextResponse.json({ 
            comments: activityComments.map(c => ({
                ...c,
                userName: c.userName || "Anonymous",
                userPhoto: c.userPhoto || null,
            }))
        });

    } catch (error: any) {
        console.error("Comments Fetch Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { activityId, userId, text, parentId } = body;

        if (!activityId || !userId || !text) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Ensure user exists (foreign key)
        await db.insert(users).values({ id: userId, email: "user@example.com" }).onConflictDoNothing();

        const newId = crypto.randomUUID();
        const [newComment] = await db.insert(comments).values({
            id: newId,
            activityId,
            userId,
            content: text,
            parentId: parentId || null,
        }).returning();

        // Broadcast to Supabase
        if (supabase) {
            try {
                const [user] = await db.select().from(users).where(eq(users.id, userId));
                await supabase.channel(`activity:${activityId}`).send({
                    type: 'broadcast',
                    event: 'new-comment',
                    payload: {
                        id: newId,
                        text,
                        userId,
                        userName: user?.displayName || "Anonymous",
                        userPhoto: user?.photoURL || null,
                        parentId: parentId || null,
                        createdAt: newComment.createdAt
                    }
                });
            } catch (err) {
                console.error("[Supabase] Broadcast Failed:", err);
            }
        }

        return NextResponse.json({ success: true, commentId: newId });

    } catch (error: any) {
        console.error("Comment Create Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const commentId = searchParams.get("id");
        const userId = searchParams.get("userId");

        if (!commentId || !userId) {
            return NextResponse.json({ error: "Missing ID or userId" }, { status: 400 });
        }

        // Fetch to check ownership (or perform in WHERE)
        // For simplicity: Admin check would happen here or in a middleware/helper
        await db.delete(comments).where(and(eq(comments.id, commentId), eq(comments.userId, userId)));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Comment Delete Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
