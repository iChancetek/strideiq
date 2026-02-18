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
    const userStatsRef = adminDb.collection("users").doc(userId).collection("stats").doc("currentMonth");
    const allTimeStatsRef = adminDb.collection("users").doc(userId).collection("stats").doc("allTime");

    // Helper to get month key
    const dateObj = new Date(activity.date);
    const monthKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
    const monthlyStatsRef = adminDb.collection("users").doc(userId).collection("stats").doc(monthKey);

    try {
        await adminDb.runTransaction(async (transaction) => {
            // Read current all-time stats first to check badges/records
            const allTimeDoc = await transaction.get(allTimeStatsRef);
            const currentAllTime = allTimeDoc.data() || { totalMiles: 0, badges: [], records: {} };

            const oldTotalMiles = currentAllTime.totalMiles || 0;
            const newTotalMilesAllTime = oldTotalMiles + activity.distance;

            // --- BADGE LOGIC ---
            const currentBadges = new Set(currentAllTime.badges?.map((b: any) => b.id) || []);
            const newBadges: any[] = [...(currentAllTime.badges || [])];

            MILESTONE_BADGES.forEach(badge => {
                if (newTotalMilesAllTime >= badge.limit && !currentBadges.has(badge.id)) {
                    newBadges.push({ id: badge.id, earnedAt: FieldValue.serverTimestamp() });
                }
            });

            // --- RECORDS LOGIC ---
            const records = currentAllTime.records || {};
            let recordsUpdated = false;

            // 1. Longest Distance (Any Type)
            if (!records.longestDistance || activity.distance > records.longestDistance.value) {
                records.longestDistance = { value: activity.distance, activityId: activity.id, date: activity.date, display: `${activity.distance.toFixed(2)} mi` };
                recordsUpdated = true;
            }

            // 2. Longest Run (Type specific)
            if (activity.type === "run") {
                if (!records.longestRun || activity.distance > records.longestRun.value) {
                    records.longestRun = { value: activity.distance, activityId: activity.id, date: activity.date, display: `${activity.distance.toFixed(2)} mi` };
                    recordsUpdated = true;
                }
            }

            // 3. Fastest Mile (Check splits)
            if (activity.mileSplits && activity.mileSplits.length > 0) {
                const fastestSplit = Math.min(...activity.mileSplits);
                // Only count full miles or reasonable splits (e.g. > 3 min/mile to filter glitches, though app has filters)
                // activity.mileSplits are in seconds
                if (!records.fastestMile || fastestSplit < records.fastestMile.value) {
                    // Format duration
                    const mins = Math.floor(fastestSplit / 60);
                    const secs = Math.round(fastestSplit % 60);
                    const display = `${mins}:${secs.toString().padStart(2, '0')}`;

                    records.fastestMile = { value: fastestSplit, activityId: activity.id, date: activity.date, display };
                    recordsUpdated = true;
                }
            }


            // 1. Update All Time Stats with Badges/Records
            transaction.set(allTimeStatsRef, {
                totalMiles: FieldValue.increment(activity.distance),
                totalRuns: FieldValue.increment(1),
                totalTime: FieldValue.increment(activity.duration),
                totalSteps: FieldValue.increment(activity.steps || 0),
                badges: newBadges,
                records: records,
                lastUpdated: FieldValue.serverTimestamp()
            }, { merge: true });

            // 2. Update Monthly Stats
            transaction.set(monthlyStatsRef, {
                totalMiles: FieldValue.increment(activity.distance),
                totalRuns: FieldValue.increment(1),
                totalTime: FieldValue.increment(activity.duration),
                totalSteps: FieldValue.increment(activity.steps || 0),
                month: monthKey,
                year: dateObj.getFullYear(),
                lastUpdated: FieldValue.serverTimestamp()
            }, { merge: true });

            // 3. Update Leaderboard Entry
            const leaderboardRef = adminDb.collection("leaderboards").doc(monthKey).collection("entries").doc(userId);

            // Note: We need to calc monthly values manually or separate query if we need exact "newTotal" for monthly leaderboard in same tx without read.
            // Simplified: we read monthly stats doc first to get accurate increment base? 
            // Actually, we can just read the monthly doc.
            const monthlyDocRead = await transaction.get(monthlyStatsRef); // This might be empty if first run of month
            const mData = monthlyDocRead.data() || { totalMiles: 0, totalRuns: 0, totalTime: 0, totalSteps: 0 };

            // We just added `activity` to `monthlyStatsRef` via set/merge above? No, we queued the write.
            // If we read it now, we see OLD data.
            // So we take OLD data + current activity.

            const mNewTotalMiles = (mData.totalMiles || 0) + activity.distance;
            const mNewTotalRuns = (mData.totalRuns || 0) + 1;
            const mNewTotalTime = (mData.totalTime || 0) + activity.duration;
            const mNewTotalSteps = (mData.totalSteps || 0) + (activity.steps || 0);
            const mNewAvgPace = mNewTotalMiles > 0 ? (mNewTotalTime / mNewTotalMiles) : 0;

            // Get User Profile
            const userProfileRef = adminDb.collection("users").doc(userId);
            const userProfileDoc = await transaction.get(userProfileRef);
            const userData = userProfileDoc.data() || { displayName: "Runner", photoURL: null };

            transaction.set(leaderboardRef, {
                userId,
                displayName: userData.displayName || "Anonymous Runner",
                photoURL: userData.photoURL,
                totalMiles: mNewTotalMiles,
                totalRuns: mNewTotalRuns,
                totalTime: mNewTotalTime,
                totalSteps: mNewTotalSteps,
                avgPace: mNewAvgPace, // seconds per mile
                month: monthKey,
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });

            // 4. Update Steps Leaderboard (separate collection)
            const stepsLeaderboardRef = adminDb.collection("stepsLeaderboards").doc(monthKey).collection("entries").doc(userId);
            transaction.set(stepsLeaderboardRef, {
                userId,
                displayName: userData.displayName || "Anonymous Runner",
                photoURL: userData.photoURL,
                totalSteps: mNewTotalSteps,
                totalRuns: mNewTotalRuns,
                month: monthKey,
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
        });

        console.log(`Stats updated for user ${userId}`);
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
}
