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

const STEPS_MILESTONES = [
    { id: "100k_steps", limit: 100000, label: "100,000 Steps" },
    { id: "250k_steps", limit: 250000, label: "250,000 Steps" },
    { id: "500k_steps", limit: 500000, label: "500,000 Steps" },
    { id: "1m_steps", limit: 1000000, label: "1 Million Steps" },
    { id: "5m_steps", limit: 5000000, label: "5 Million Steps" },
    { id: "10m_steps", limit: 10000000, label: "10 Million Steps" },
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
            ]);

            // ── Derive existing data with safe defaults ──
            const currentAllTime = allTimeDoc.data() || { 
                totalMiles: 0, 
                totals: { Run: 0, Walk: 0, Bike: 0, Hike: 0 } as any,
                badges: [], 
                records: {} as any, 
                streaks: { current: 0, max: 0, lastDate: null as string | null },
                levels: { Run: "yellow", Walk: "yellow", Bike: "yellow", Hike: "yellow" }
            };
            const currentMonthly = monthlyDoc.data() || { totalMiles: 0, totalRuns: 0, totalTime: 0, totalSteps: 0 };

            let userData: { displayName: string; photoURL: string | null } = { displayName: "Runner", photoURL: null };
            if (userProfileDoc.exists) {
                const d = userProfileDoc.data();
                if (d) {
                    userData = { 
                        displayName: d.displayName || d.name || "Runner", 
                        photoURL: d.photoURL || d.avatarUrl || null 
                    };
                }
            }

            const notifications: any[] = [];
            const dist = Number(activity.distance) || 0;
            const dur = Number(activity.duration) || 0;
            const type = activity.type || "Run";
            const typeKey = (type.charAt(0).toUpperCase() + type.slice(1).toLowerCase());

            // ── 1. Milestone Badge Logic ──
            const oldTotalMiles = currentAllTime.totalMiles || 0;
            const newTotalMilesAllTime = oldTotalMiles + dist;
            const currentBadges = new Set((currentAllTime.badges || []).map((b: any) => b.id));
            const newBadges: any[] = [...(currentAllTime.badges || [])];
            
            MILESTONE_BADGES.forEach((badge) => {
                if (newTotalMilesAllTime >= badge.limit && !currentBadges.has(badge.id)) {
                    const b = { id: badge.id, earnedAt: FieldValue.serverTimestamp(), label: `${badge.limit} Mile Milestone` };
                    newBadges.push(b);
                    notifications.push({
                        type: "achievement",
                        title: "New Milestone Earned! 🏆",
                        content: `You've reached ${badge.limit} lifetime miles! Incredible work.`,
                        achievementId: badge.id
                    });
                }
            });

            // Step Milestones
            const oldTotalSteps = currentAllTime.totalSteps || 0;
            const activitySteps = Number(activity.steps) || 0;
            const newTotalStepsAllTime = oldTotalSteps + activitySteps;

            STEPS_MILESTONES.forEach((badge) => {
                if (newTotalStepsAllTime >= badge.limit && !currentBadges.has(badge.id)) {
                    const b = { id: badge.id, earnedAt: FieldValue.serverTimestamp(), label: badge.label };
                    newBadges.push(b);
                    notifications.push({
                        type: "achievement",
                        title: "New Step Goal! 👣",
                        content: `You've reached ${badge.limit.toLocaleString()} lifetime steps!`,
                        achievementId: badge.id
                    });
                }
            });

            // ── 2. Records (PB) Logic ──
            const records = { ...(currentAllTime.records || {}) };
            
            const checkAndNotifyPB = (key: string, value: number, label: string, isPace = false) => {
                const existing = records[key];
                // For pace, lower is better. For distance/duration, higher is better.
                const isBetter = !existing || (isPace ? value < existing.value : value > existing.value);
                
                if (isBetter) {
                    records[key] = {
                        value,
                        activityId: activity.id || "manual",
                        date: activity.date,
                        display: isPace ? `${Math.floor(value/60)}:${(value%60).toFixed(0).padStart(2,'0')} /mi` : 
                                 key === 'maxSteps' ? `${value.toLocaleString()} steps` :
                                 `${value.toFixed(2)} mi`
                    };
                    notifications.push({
                        type: "achievement",
                        title: "New Personal Best! 🔥",
                        content: `You just set a new record for ${label}: ${records[key].display}!`,
                        achievementId: key
                    });
                }
            };

            // Longest distance is always tracked across all types 
            if (!records.longestDistance || dist > records.longestDistance.value) {
                checkAndNotifyPB("longestDistance", dist, "Longest Activity");
            }

            // Max steps in a single session
            if (activitySteps > (records.maxSteps?.value || 0)) {
                checkAndNotifyPB("maxSteps", activitySteps, "Most Steps");
            }

            // High-precision PBs for Running
            if (type.toLowerCase() === "run") {
                const pace = dist > 0 ? dur / dist : 0;
                
                // Track standard distance PBs. 
                // We use a looser bound here (at least the distance) to account for GPS wobble 
                // but keep it within reason (max 15% over) to ensure it's "intended" for that distance.
                // NOTE: Proper split calculation is done in the tracker; this is a whole-activity fallback.
                const PB_MARKS = [
                    { key: "fastest1mi", dist: 1.0, label: "Fastest 1 Mile" },
                    { key: "fastest5k", dist: 3.106, label: "Fastest 5K" },
                    { key: "fastest10k", dist: 6.213, label: "Fastest 10K" },
                    { key: "fastestHalf", dist: 13.109, label: "Fastest Half Marathon" },
                    { key: "fastestFull", dist: 26.218, label: "Fastest Marathon" }
                ];

                PB_MARKS.forEach(mark => {
                    if (dist >= mark.dist && dist <= mark.dist * 1.15) {
                        checkAndNotifyPB(mark.key, pace, mark.label, true);
                    }
                });
            }

            // ── 3. Streak Logic ──
            const streaks = { ...(currentAllTime.streaks || { current: 0, max: 0, lastDate: null }) };
            const todayStr = dateObj.toDateString();
            const lastDateStr = streaks.lastDate;

            if (lastDateStr !== todayStr) {
                const lastDate = lastDateStr ? new Date(lastDateStr) : null;
                const yesterday = new Date(dateObj);
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (lastDate && lastDate.toDateString() === yesterday.toDateString()) {
                    streaks.current += 1;
                } else {
                    streaks.current = 1;
                }
                
                if (streaks.current > (streaks.max || 0)) {
                    streaks.max = streaks.current;
                }
                streaks.lastDate = todayStr;

                // Notify on streak milestones
                const STREAK_MILESTONES = [7, 30, 100, 365];
                if (STREAK_MILESTONES.includes(streaks.current)) {
                    notifications.push({
                        type: "achievement",
                        title: `${streaks.current} Day Streak! ⚡`,
                        content: `You've logged an activity for ${streaks.current} days in a row! Unstoppable.`,
                        achievementId: `streak_${streaks.current}`
                    });
                }
            }

            // ── 4. Level Progress Logic ──
            const levels = { ...(currentAllTime.levels || { Run: "yellow", Walk: "yellow", Bike: "yellow", Hike: "yellow" }) };
            
            if (levels[typeKey as keyof typeof levels] !== undefined) {
                // Determine level based on specific activity type's mileage
                const currentTypeMiles = (currentAllTime.totals?.[typeKey] || 0) + dist;
                
                const getLevel = (m: number) => {
                    if (m >= 9321) return "volt";
                    if (m >= 3106) return "black";
                    if (m >= 1553) return "purple";
                    if (m >= 621) return "blue";
                    if (m >= 155) return "green";
                    if (m >= 31) return "orange";
                    return "yellow";
                };

                const newLvl = getLevel(currentTypeMiles);
                if (newLvl !== levels[typeKey as keyof typeof levels]) {
                    levels[typeKey as keyof typeof levels] = newLvl;
                    notifications.push({
                        type: "achievement",
                        title: "Level Up! 👟",
                        content: `Congratulations! You've reached ${newLvl.toUpperCase()} level in ${typeKey}!`,
                        achievementId: `level_${typeKey}_${newLvl}`
                    });
                }
            }

            // ── 5. Monthly Milestone Logic (Bronze/Silver/Gold) ──
            const mOldMiles = currentMonthly.totalMiles || 0;
            const mNewMiles = mOldMiles + dist;
            
            const checkMonthly = (val: number, threshold: number, rank: string) => {
                if (val >= threshold && mOldMiles < threshold) {
                    notifications.push({
                        type: "achievement",
                        title: `${rank} Monthly Milestone! 🏅`,
                        content: `You've logged ${threshold} miles this month. You earned the ${rank} badge!`,
                        achievementId: `monthly_${rank.toLowerCase()}`
                    });
                }
            };
            checkMonthly(mNewMiles, 15, "Bronze");
            checkMonthly(mNewMiles, 25, "Silver");
            checkMonthly(mNewMiles, 50, "Gold");

            // ────────────────────────────────────────────────────────────
            // PHASE 2 — ALL WRITES
            // ────────────────────────────────────────────────────────────

            // 1. Update All-time stats doc
            transaction.set(allTimeStatsRef, {
                totalMiles: FieldValue.increment(dist),
                [`totals.${typeKey}`]: FieldValue.increment(dist),
                totalRuns: FieldValue.increment(1),
                totalTime: FieldValue.increment(activity.duration || 0),
                totalSteps: FieldValue.increment(activity.steps || 0),
                badges: newBadges,
                records,
                streaks,
                levels,
                lastUpdated: FieldValue.serverTimestamp(),
            }, { merge: true });

            // 2. Monthly stats doc
            transaction.set(monthlyStatsRef, {
                totalMiles: FieldValue.increment(dist),
                totalRuns: FieldValue.increment(1),
                totalTime: FieldValue.increment(activity.duration || 0),
                totalSteps: FieldValue.increment(activity.steps || 0),
                month: monthKey,
                year: dateObj.getFullYear(),
                lastUpdated: FieldValue.serverTimestamp(),
            }, { merge: true });

            // 3. Leaderboards
            const mNewTotalMiles = (currentMonthly.totalMiles || 0) + dist;
            const mNewTotalRuns = (currentMonthly.totalRuns || 0) + 1;
            const mNewTotalTime = (currentMonthly.totalTime || 0) + (activity.duration || 0);
            const mNewTotalSteps = (currentMonthly.totalSteps || 0) + (activity.steps || 0);
            const mNewAvgPace = mNewTotalMiles > 0 ? mNewTotalTime / mNewTotalMiles : 0;

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

            transaction.set(stepsLeaderboardRef, {
                userId,
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                totalSteps: mNewTotalSteps,
                totalRuns: mNewTotalRuns,
                month: monthKey,
                updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });

            // 4. Create Notifications
            notifications.forEach(n => {
                const nRef = adminDb.collection("notifications").doc();
                transaction.set(nRef, {
                    ...n,
                    userId,
                    read: false,
                    createdAt: FieldValue.serverTimestamp(),
                });
            });
        });

        console.log(`[SESSION_SAVE_SUCCESS] Stats and achievements updated for user ${userId}`);
    } catch (e: any) {
        console.error(`[SESSION_SAVE_FAILURE] Transaction failed for user ${userId}:`, e);
        throw e;
    }
}

export async function decrementUserStats(userId: string, activity: any) {
    const dateObj = new Date(activity.date.toDate ? activity.date.toDate() : activity.date);
    const monthKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, "0")}`;

    const allTimeStatsRef = adminDb.collection("users").doc(userId).collection("stats").doc("allTime");
    const monthlyStatsRef = adminDb.collection("users").doc(userId).collection("stats").doc(monthKey);
    
    const dist = Number(activity.distance) || 0;
    const dur = Number(activity.duration) || 0;
    const steps = Number(activity.steps) || 0;
    const type = activity.type || "Run";
    const typeKey = (type.charAt(0).toUpperCase() + type.slice(1).toLowerCase());

    try {
        await adminDb.runTransaction(async (transaction) => {
            transaction.set(allTimeStatsRef, {
                totalMiles: FieldValue.increment(-dist),
                [`totals.${typeKey}`]: FieldValue.increment(-dist),
                totalRuns: FieldValue.increment(-1),
                totalTime: FieldValue.increment(-dur),
                totalSteps: FieldValue.increment(-steps),
                lastUpdated: FieldValue.serverTimestamp(),
            }, { merge: true });

            transaction.set(monthlyStatsRef, {
                totalMiles: FieldValue.increment(-dist),
                totalRuns: FieldValue.increment(-1),
                totalTime: FieldValue.increment(-dur),
                totalSteps: FieldValue.increment(-steps),
                lastUpdated: FieldValue.serverTimestamp(),
            }, { merge: true });
        });
        console.log(`[SESSION_DECREMENT_SUCCESS] Stats decremented for user ${userId}`);
    } catch (e) {
        console.error(`[SESSION_DECREMENT_FAILURE] Failed to decrement stats for user ${userId}:`, e);
    }
}

