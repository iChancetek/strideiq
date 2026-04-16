import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { headers } from "next/headers";

export async function GET(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const dateObj = new Date();
        const monthKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, "0")}`;

        let allTimeSnap = await adminDb.collection("users").doc(userId).collection("stats").doc("allTime").get();
        let monthlySnap = await adminDb.collection("users").doc(userId).collection("stats").doc(monthKey).get();

        const allTimeData = allTimeSnap.data() || {};
        const isBackfillNeeded = !allTimeSnap.exists || !allTimeData.totalMiles || !allTimeData.totals || Object.keys(allTimeData.records || {}).length === 0;

        // --- LAZY MIGRATION ---
        // If allTime stats are missing or incomplete, perform a one-time calculation from history
        if (isBackfillNeeded) {
            console.log(`[LAZY_MIGRATION] Backfilling stats for user: ${userId}`);
            const snapshot = await adminDb.collection("entries")
                .where("userId", "==", userId)
                .where("isDeleted", "==", false)
                .get();

            const activities = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
                };
            }).sort((a, b) => a.date.getTime() - b.date.getTime());

            if (activities.length > 0) {
               let totalMiles = 0;
               let totalSteps = 0;
               let totals = { Run: 0, Walk: 0, Bike: 0, Hike: 0 } as any;
               let records: any = {};
               let streaks = { current: 0, max: 0, lastDate: null as any };
               
               activities.forEach(a => {
                   const dist = Number(a.distance) || 0;
                   const dur = Number(a.duration) || 0;
                   const steps = Number(a.steps) || 0;
                   totalMiles += dist;
                   totalSteps += steps;
                   
                   const typeRaw = (a.type || 'Run');
                   const typeKey = typeRaw.charAt(0).toUpperCase() + typeRaw.slice(1).toLowerCase();
                   totals[typeKey] = (totals[typeKey] || 0) + dist;
                   
                   // Streak calc
                   const dStr = new Date(a.date).toDateString();
                   if (streaks.lastDate !== dStr) {
                       const lastD = streaks.lastDate ? new Date(streaks.lastDate) : null;
                       const yest = new Date(a.date);
                       yest.setDate(yest.getDate() - 1);
                       if (lastD && lastD.toDateString() === yest.toDateString()) {
                           streaks.current += 1;
                       } else {
                           streaks.current = 1;
                       }
                       if (streaks.current > streaks.max) streaks.max = streaks.current;
                       streaks.lastDate = dStr;
                   }

                   const type = typeRaw.toLowerCase();
                   if (type === 'run' || type === 'walking' || type === 'walk' || type === 'hike' || type === 'bike') {
                       const pace = dist > 0 ? dur / dist : 0;
                       
                       // Cross-activity longest distance
                       if (!records.longestRun || dist > records.longestRun.value) {
                           records.longestRun = { value: dist, date: a.date };
                       }

                       // Max steps
                       if (!records.maxSteps || steps > records.maxSteps.value) {
                           records.maxSteps = { value: steps, display: `${steps.toLocaleString()} steps`, date: a.date };
                       }

                       if (type === 'run') {
                           const checkPB = (key: string, targetDist: number) => {
                               if (dist >= targetDist * 0.95 && dist <= targetDist * 1.15) {
                                   if (!records[key] || pace < records[key].value) {
                                       records[key] = { value: pace, display: `${Math.floor(pace/60)}:${(pace%60).toFixed(0).padStart(2,'0')} /mi`, duration: dur, date: a.date };
                                   }
                               }
                           };
                           checkPB("fastest1mi", 1.0);
                           checkPB("fastest5k", 3.106);
                           checkPB("fastest10k", 6.213);
                           checkPB("fastestHalf", 13.109);
                           checkPB("fastestFull", 26.218);
                       }
                   }
               });
               
               await adminDb.collection("users").doc(userId).collection("stats").doc("allTime").set({
                   totalMiles,
                   totalSteps,
                   totals,
                   records,
                   streaks,
                   lastUpdated: FieldValue.serverTimestamp()
               }, { merge: true });
               
               // Re-fetch
               allTimeSnap = await adminDb.collection("users").doc(userId).collection("stats").doc("allTime").get();
            }
        }

        const allTime = allTimeSnap.data() || { 
            totalMiles: 0, 
            totalSteps: 0,
            totals: { Run: 0, Walk: 0, Bike: 0, Hike: 0 },
            records: {}, 
            streaks: { current: 0, max: 0 }, 
            levels: { Run: "yellow", Walk: "yellow", Bike: "yellow", Hike: "yellow" } 
        };
        const monthly = monthlySnap.data() || { totalMiles: 0 };

        const pbs = {
            fastest_1mi: allTime.records?.fastest1mi || null,
            fastest_5k: allTime.records?.fastest5k || null,
            fastest_10k: allTime.records?.fastest10k || null,
            fastest_half_marathon: allTime.records?.fastestHalf || null,
            fastest_marathon: allTime.records?.fastestFull || null,
            farthest_run: allTime.records?.longestRun?.value || 0,
            max_steps: allTime.records?.maxSteps || null,
            longest_duration: allTime.records?.longestDuration?.value || 0,
        };

        return NextResponse.json({
            totals: allTime.totals || {
                Run: allTime.totalMiles || 0,
                Walk: 0, 
                Bike: 0, 
                Hike: 0
            },
            allTimeSteps: allTime.totalSteps || 0,
            pbs,
            streakCount: allTime.streaks?.current || 0,
            maxStreak: allTime.streaks?.max || 0,
            currentMonthMiles: monthly.totalMiles || 0,
            levels: allTime.levels || { Run: "yellow" },
            badges: allTime.badges || []
        });

    } catch (error: any) {
        console.error("Achievements Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

