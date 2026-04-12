import { db } from "@/db";
import { activities, userStats } from "@/db/schema";
import { eq, sum, count } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/auth-utils";

export async function GET() {
    try {
        const auth = await verifyFirebaseToken();
        if (auth.error || !auth.userId) {
            return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
        }
        
        // 1. Fetch denormalized stats
        const stats = await db.query.userStats.findFirst({
            where: eq(userStats.userId, auth.userId)
        });

        // 2. Aggregate some living stats from activities for comparison/freshness if needed
        const aggregates = await db.select({
            totalDist: sum(activities.distance),
            totalCals: sum(activities.calories),
            totalCount: count(activities.id)
        }).from(activities).where(eq(activities.userId, auth.userId));

        const agg = aggregates[0];

        return NextResponse.json({
            ...stats,
            living: {
                totalDistance: Number(agg.totalDist) || 0,
                totalCalories: Number(agg.totalCals) || 0,
                totalActivities: Number(agg.totalCount) || 0,
            }
        });
    } catch (error: any) {
        console.error("[Stats API] GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
