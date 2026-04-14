import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        // Fetch all activities for calculation
        // On very large accounts, this could be slow. Future optimization: pre-calculate in user doc.
        const snapshot = await adminDb.collection("entries")
            .where("userId", "==", userId)
            .where("isDeleted", "==", false)
            .get();

        const activities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[];

        // 1. Lifetime Totals per Category
        const totals: Record<string, number> = { Run: 0, Walk: 0, Bike: 0, Hike: 0 };
        activities.forEach(a => {
            if (totals[a.type] !== undefined) {
                totals[a.type] += Number(a.distance) || 0;
            }
        });

        // 2. Personal Bests (PBs)
        // Group by distance thresholds
        const pbs: any = {
            fastest_1k: null,
            fastest_1mi: null,
            fastest_5k: null,
            fastest_10k: null,
            fastest_half_marathon: null,
            fastest_marathon: null,
            longest_duration: 0,
            farthest_run: 0,
        };

        activities.forEach(a => {
            const dist = Number(a.distance) || 0;
            const dur = Number(a.duration) || 0;
            const type = a.type;

            if (type === "Run") {
                if (dist > pbs.farthest_run) pbs.farthest_run = dist;
                if (dur > pbs.longest_duration) pbs.longest_duration = dur;

                const checkPB = (key: string, threshold: number) => {
                    // Check if activity distance is close to threshold
                    if (dist >= threshold && dist <= threshold * 1.05) {
                        const pace = dist > 0 ? dur / dist : 0; // seconds per mile
                        if (!pbs[key] || (dur < pbs[key].duration)) {

                            pbs[key] = { duration: dur, date: a.date, id: a.id };
                        }
                    }
                };

                checkPB("fastest_1k", 0.621);
                checkPB("fastest_1mi", 1.0);
                checkPB("fastest_5k", 3.106);
                checkPB("fastest_10k", 6.213);
                checkPB("fastest_half_marathon", 13.109);
                checkPB("fastest_marathon", 26.218);
            }
        });

        // 3. Monthly Miles (Current & History)
        const monthlyMiles: Record<string, number> = {};
        activities.forEach(a => {
            const date = new Date(a.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            monthlyMiles[monthKey] = (monthlyMiles[monthKey] || 0) + (Number(a.distance) || 0);
        });

        // 4. Streaks
        // Simply return count of active days for streak-badges simplified calc
        const activeDays = new Set(activities.map(a => new Date(a.date).toDateString()));
        
        return NextResponse.json({
            totals,
            pbs,
            monthlyMiles,
            streakCount: activeDays.size,
            activeDays: Array.from(activeDays)
        });

    } catch (error: any) {
        console.error("Achievements Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
