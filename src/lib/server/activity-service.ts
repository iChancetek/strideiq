import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

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

    const allTimeStatsRef = adminDb.collection("users").doc(userId).collection("stats").doc("allTime");
    const monthlyStatsRef = adminDb.collection("users").doc(userId).collection("stats").doc(monthKey);
    const userProfileRef = adminDb.collection("users").doc(userId);
    const leaderboardRef = adminDb.collection("leaderboards").doc(monthKey).collection("entries").doc(userId);
    const stepsLeaderboardRef = adminDb.collection("stepsLeaderboards").doc(monthKey).collection("entries").doc(userId);

    try {
        console.log(`[SESSION_SAVE_START] Processing stats for user ${userId}...`);
        await adminDb.runTransaction(async (transaction) => {
            // ────────────────────────────────────────────────────────────
            // PHASE 1 — ALL READS FIRST
            // ────────────────────────────────────────────────────────────
            const [allTimeDoc, monthlyDoc, userProfileDoc] = await Promise.all([
                transaction.get(allTimeStatsRef),
                transaction.get(monthlyStatsRef),
                transaction.get(userProfileRef),
            ]).catch(err => {
                console.error("[SESSION_SAVE_READ_ERROR]:", err);
                throw new Error(`Failed to read stats: ${err.message}`);
            });

            // ── Derive existing data with safe defaults ──
            const currentAllTime = allTimeDoc.data() || { totalMiles: 0, badges: [], records: {} };
            const currentMonthly = monthlyDoc.data() || { totalMiles: 0, totalRuns: 0, totalTime: 0, totalSteps: 0 };

            let userData = { displayName: "Runner", photoURL: null as string | null };
            if (userProfileDoc.exists) {
                const d = userProfileDoc.data();
                if (d) {
                    userData = { 
                        displayName: d.displayName || d.name || "Runner", 
                        photoURL: d.photoURL || d.avatarUrl || null 
                    };
                }
            }

            // ── Badge logic ──
            const oldTotalMiles = currentAllTime.totalMiles || 0;
            const newTotalMilesAllTime = oldTotalMiles + (activity.distance || 0);
            const currentBadges = new Set((currentAllTime.badges || []).map((b: any) => b.id));
            const newBadges: any[] = [...(currentAllTime.badges || [])];
            
            MILESTONE_BADGES.forEach((badge) => {
                if (newTotalMilesAllTime >= badge.limit && !currentBadges.has(badge.id)) {
                    newBadges.push({ id: badge.id, earnedAt: FieldValue.serverTimestamp() });
                }
            });

            // ── Records logic ──
            const records = { ...(currentAllTime.records || {}) };
            const dist = activity.distance || 0;
            
            if (!records.longestDistance || dist > records.longestDistance.value) {
                records.longestDistance = {
                    value: dist,
                    activityId: activity.id || "manual",
                    date: activity.date,
                    display: `${dist.toFixed(2)} mi`,
                };
            }
            
            if (activity.type?.toLowerCase() === "run") {
                if (!records.longestRun || dist > records.longestRun.value) {
                    records.longestRun = {
                        value: dist,
                        activityId: activity.id || "manual",
                        date: activity.date,
                        display: `${dist.toFixed(2)} mi`,
                    };
                }
            }

            // ── Derive new monthly totals ──
            const mNewTotalMiles = (currentMonthly.totalMiles || 0) + dist;
            const mNewTotalRuns = (currentMonthly.totalRuns || 0) + 1;
            const mNewTotalTime = (currentMonthly.totalTime || 0) + (activity.duration || 0);
            const mNewTotalSteps = (currentMonthly.totalSteps || 0) + (activity.steps || 0);
            const mNewAvgPace = mNewTotalMiles > 0 ? mNewTotalTime / mNewTotalMiles : 0;

            // ────────────────────────────────────────────────────────────
            // PHASE 2 — ALL WRITES
            // ────────────────────────────────────────────────────────────

            // 1. All-time stats
            transaction.set(allTimeStatsRef, {
                totalMiles: FieldValue.increment(dist),
                totalRuns: FieldValue.increment(1),
                totalTime: FieldValue.increment(activity.duration || 0),
                totalSteps: FieldValue.increment(activity.steps || 0),
                badges: newBadges,
                records,
                lastUpdated: FieldValue.serverTimestamp(),
            }, { merge: true });

            // 2. Monthly stats
            transaction.set(monthlyStatsRef, {
                totalMiles: FieldValue.increment(dist),
                totalRuns: FieldValue.increment(1),
                totalTime: FieldValue.increment(activity.duration || 0),
                totalSteps: FieldValue.increment(activity.steps || 0),
                month: monthKey,
                year: dateObj.getFullYear(),
                lastUpdated: FieldValue.serverTimestamp(),
            }, { merge: true });

            // 3. Leaderboard entry
            transaction.set(leaderboardRef, {
                userId,
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                totalMiles: mNewTotalMiles,
                totalRuns: mNewTotalRuns,
                totalTime: mNewTotalTime,
                totalSteps: mNewTotalSteps,
                avgPace: mNewAvgPace,
                month: monthKey,
                updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });

            // 4. Steps leaderboard
            transaction.set(stepsLeaderboardRef, {
                userId,
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                totalSteps: mNewTotalSteps,
                totalRuns: mNewTotalRuns,
                month: monthKey,
                updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
        });

        console.log(`[SESSION_SAVE_SUCCESS] Stats updated for user ${userId}`);
    } catch (e: any) {
        console.error(`[SESSION_SAVE_FAILURE] Transaction failed for user ${userId}:`, e);
        throw e;
    }
}
