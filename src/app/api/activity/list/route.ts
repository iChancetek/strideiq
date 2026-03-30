import { NextResponse } from "next/server";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const limitParam = searchParams.get('limit');
        const offsetParam = searchParams.get('offset');

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        const limit = limitParam ? parseInt(limitParam) : 50;
        const offset = offsetParam ? parseInt(offsetParam) : 0;

        const userActivities = await db.query.activities.findMany({
            where: eq(activities.userId, userId),
            orderBy: [desc(activities.date)],
            limit: limit,
            offset: offset,
        });

        return NextResponse.json({ 
            activities: userActivities,
            meta: { limit, offset, count: userActivities.length }
        });
    } catch (error: any) {
        console.error("Fetch Activities Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
