import { NextResponse } from "next/server";
import { db } from "@/db";
import { leaderboards, users, friendships } from "@/db/schema";
import { eq, desc, and, inArray, or } from "drizzle-orm";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const type = searchParams.get("type") || "global";

        // Default to current month if not specified
        const now = new Date();
        const defaultPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        const period = searchParams.get("period") || defaultPeriod;

        if (!userId && type === "friends") {
            return NextResponse.json({ error: "User ID required for friends leaderboard" }, { status: 400 });
        }

        let friendIds: string[] = [];

        if (type === "friends" && userId) {
            // Fetch accepted friend relations
            const friendsData = await db.query.friendships.findMany({
                where: and(
                    eq(friendships.status, "accepted"),
                    or(
                        eq(friendships.senderId, userId),
                        eq(friendships.receiverId, userId)
                    )
                ),
            });

            const uniqueFriendIds = new Set<string>([userId]);
            friendsData.forEach(f => {
                uniqueFriendIds.add(f.senderId);
                uniqueFriendIds.add(f.receiverId);
            });
            friendIds = Array.from(uniqueFriendIds);

            if (friendIds.length === 0) {
                return NextResponse.json({ entries: [] });
            }
        }

        // Query the leaderboards with joined user data
        const entriesQuery = typeof db.select === 'function' ? db.select({
            userId: leaderboards.userId,
            totalMiles: leaderboards.totalMiles,
            totalRuns: leaderboards.totalRuns,
            totalTime: leaderboards.totalTime,
            totalSteps: leaderboards.totalSteps,
            avgPace: leaderboards.avgPace,
            month: leaderboards.month,
            displayName: users.displayName,
            photoURL: users.photoURL,
        }).from(leaderboards)
        .leftJoin(users, eq(leaderboards.userId, users.id))
        .where(
            type === "friends" && friendIds.length > 0
                ? and(eq(leaderboards.month, period), inArray(leaderboards.userId, friendIds))
                : eq(leaderboards.month, period)
        )
        .orderBy(desc(leaderboards.totalMiles))
        .limit(50) : null;
        
        let entries: any[] = [];
        if (entriesQuery) entries = await entriesQuery;

        return NextResponse.json({ entries });

    } catch (error: any) {
        console.error("Leaderboard API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
