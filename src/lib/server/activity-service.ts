import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function updateUserStats(userId: string, activity: any) {
    const userStatsRef = adminDb.collection("users").doc(userId).collection("stats").doc("currentMonth");
    const allTimeStatsRef = adminDb.collection("users").doc(userId).collection("stats").doc("allTime");

    // Helper to get month key
    const dateObj = new Date(activity.date);
    const monthKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
    const monthlyStatsRef = adminDb.collection("users").doc(userId).collection("stats").doc(monthKey);

    try {
        await adminDb.runTransaction(async (transaction) => {
            // 1. Update All Time Stats
            transaction.set(allTimeStatsRef, {
                totalMiles: FieldValue.increment(activity.distance),
                totalRuns: FieldValue.increment(1),
                totalTime: FieldValue.increment(activity.duration),
                totalSteps: FieldValue.increment(activity.steps || 0),
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

            // Read current monthly stats to get the NEW total
            const currentMonthDoc = await transaction.get(monthlyStatsRef);
            const currentData = currentMonthDoc.data() || { totalMiles: 0, totalRuns: 0, totalTime: 0 };

            // Calculate new totals (Client SDK 'increment' applies at commit, but Admin SDK might behave similarly 
            // inside transaction, we need to be careful. 
            // Actually, in a transaction, if we read AFTER write, we see the new value? 
            // improved: We simply add the current activity to the *read* value of the stats doc. 
            // If the stats doc didn't exist, we start with 0.)

            const newTotalMiles = (currentData.totalMiles || 0) + activity.distance;
            const newTotalRuns = (currentData.totalRuns || 0) + 1;
            const newTotalTime = (currentData.totalTime || 0) + activity.duration;
            const newTotalSteps = (currentData.totalSteps || 0) + (activity.steps || 0);
            const newAvgPace = newTotalMiles > 0 ? (newTotalTime / newTotalMiles) : 0;

            // Get User Profile
            const userProfileRef = adminDb.collection("users").doc(userId);
            const userProfileDoc = await transaction.get(userProfileRef);
            const userData = userProfileDoc.data() || { displayName: "Runner", photoURL: null };

            transaction.set(leaderboardRef, {
                userId,
                displayName: userData.displayName || "Anonymous Runner",
                photoURL: userData.photoURL,
                totalMiles: newTotalMiles,
                totalRuns: newTotalRuns,
                totalTime: newTotalTime,
                totalSteps: newTotalSteps,
                avgPace: newAvgPace, // seconds per mile
                month: monthKey,
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });

            // 4. Update Steps Leaderboard (separate collection)
            const stepsLeaderboardRef = adminDb.collection("stepsLeaderboards").doc(monthKey).collection("entries").doc(userId);
            transaction.set(stepsLeaderboardRef, {
                userId,
                displayName: userData.displayName || "Anonymous Runner",
                photoURL: userData.photoURL,
                totalSteps: newTotalSteps,
                totalRuns: newTotalRuns,
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
