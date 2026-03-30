import { db } from "@/db";
import { leaderboards, achievements, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { supabase } from "@/lib/supabase";

const MILESTONE_BADGES = [
    { id: "25_miles", limit: 25 },
    { id: "50_miles", limit: 50 },
    { id: "100_miles", limit: 100 },
    { id: "250_miles", limit: 250 },
    { id: "500_miles", limit: 500 },
    { id: "1000_miles", limit: 1000 },
];

export async function updateUserStats(userId: string, activity: any) {
    const dateObj = new Date(activity.date);
    const monthKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, "0")}`;

    try {
        // 1. Leaderboard Upsert
        await db.insert(leaderboards)
            .values({
                month: monthKey,
                userId: userId,
                totalMiles: activity.distance,
                totalSteps: activity.steps || 0,
                totalRuns: 1,
                totalTime: activity.duration,
                avgPace: activity.distance > 0 ? activity.duration / activity.distance : 0,
            })
            .onConflictDoUpdate({
                target: [leaderboards.month, leaderboards.userId],
                set: {
                    totalMiles: sql`${leaderboards.totalMiles} + EXCLUDED.total_miles`,
                    totalSteps: sql`${leaderboards.totalSteps} + EXCLUDED.total_steps`,
                    totalRuns: sql`${leaderboards.totalRuns} + 1`,
                    totalTime: sql`${leaderboards.totalTime} + EXCLUDED.total_time`,
                    // approximate average pace calculation
                    avgPace: sql`CASE WHEN (${leaderboards.totalMiles} + EXCLUDED.total_miles) > 0 
                                 THEN (${leaderboards.totalTime} + EXCLUDED.total_time) / (${leaderboards.totalMiles} + EXCLUDED.total_miles) 
                                 ELSE 0 END`,
                    lastUpdated: new Date()
                }
            });

        // 2. All-Time Stats & Badges (approximate)
        // Check current sum of all activities to award new badges
        const allTimeRes = await db.query.leaderboards.findMany({
            where: eq(leaderboards.userId, userId),
            columns: { totalMiles: true }
        });
        
        const totalMilesAllTime = allTimeRes.reduce((sum, lb) => sum + (lb.totalMiles || 0), 0);
        
        const currentBadgesRes = await db.query.achievements.findMany({
            where: eq(achievements.userId, userId)
        });
        const currentBadgeIds = new Set(currentBadgesRes.map(b => b.badgeId));

        const newBadges: { id: string, userId: string, badgeId: string }[] = [];
        MILESTONE_BADGES.forEach((badge) => {
            if (totalMilesAllTime >= badge.limit && !currentBadgeIds.has(badge.id)) {
                newBadges.push({
                    id: crypto.randomUUID(),
                    userId: userId,
                    badgeId: badge.id
                });
            }
        });

        if (newBadges.length > 0) {
            await db.insert(achievements).values(newBadges);
        }

        // 3. Trigger Realtime Events via Supabase
        if (supabase) {
            try {
                // Broadcast to user-specific channel
                await supabase.channel(`user:${userId}`).send({
                    type: 'broadcast',
                    event: 'stats-updated',
                    payload: {
                        month: monthKey,
                        addedDistance: activity.distance,
                        newBadges: newBadges.map(b => b.badgeId)
                    }
                });
                
                // Broadcast to global leaderboard channel
                await supabase.channel('leaderboard').send({
                    type: 'broadcast',
                    event: 'updated',
                    payload: { month: monthKey }
                });
            } catch (err) {
                console.error("[Supabase] Failed to broadcast event:", err);
            }
        }

        console.log(`[SESSION_SAVE_SUCCESS] Stats updated for user ${userId}`);
    } catch (e: any) {
        console.error(`[SESSION_SAVE_FAILURE] Stats update failed for user ${userId}:`, e);
        throw e;
    }
}
