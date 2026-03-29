import { db } from "@/db";
import { likes, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const activityId = searchParams.get("activityId");

        if (!activityId) {
            return NextResponse.json({ error: "Missing activityId" }, { status: 400 });
        }

        const activityLikes = await db.select({
            id: likes.id,
            userId: likes.userId,
            userName: users.displayName,
            userPhoto: users.photoURL,
            createdAt: likes.createdAt
        }).from(likes)
        .leftJoin(users, eq(likes.userId, users.id))
        .where(eq(likes.activityId, activityId))
        .orderBy(desc(likes.createdAt));

        return NextResponse.json({ 
            likes: activityLikes.map(l => ({
                userId: l.userId,
                userName: l.userName || "Anonymous",
                userPhoto: l.userPhoto || null,
            }))
        });

    } catch (error: any) {
        console.error("Likes Fetch Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
