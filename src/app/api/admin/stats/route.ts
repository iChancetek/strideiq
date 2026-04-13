import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/auth-utils";

export async function GET(req: Request) {
    try {
        const auth = await verifyAdmin();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const [usersSnap, activitiesSnap] = await Promise.all([
            adminDb.collection("users").get(),
            adminDb.collection("activities").get()
        ]);

        const users = usersSnap.docs.map(doc => doc.data());
        const activities = activitiesSnap.docs.map(doc => doc.data());

        const totalUsers = users.length;
        const totalSessions = activities.length;
        const totalMiles = activities.reduce((acc, curr) => acc + (curr.distance || 0), 0);
        const totalSteps = activities.reduce((acc, curr) => acc + (curr.steps || 0), 0);

        // Activity Breakdown
        const activityTypeCount: Record<string, number> = {};
        let activeUsersSet = new Set();
        let consecutiveDays = 0; // advanced calc omitted for MVP speed

        activities.forEach(act => {
            const type = act.type || "Unknown";
            activityTypeCount[type] = (activityTypeCount[type] || 0) + 1;
            // approximate active user via activity owner if available (not all activities might have userId ref stored directly if not careful, assuming they do or we query differently)
        });

        // 5. User Growth (Last 6 months)
        const growthCount: Record<string, number> = {};
        users.forEach(u => {
            const date = u.lastLogin?.toDate ? u.lastLogin.toDate() : new Date(u.lastLogin || Date.now());
            // Better to use creationTime if available, but for now we'll use a fallback or current month
            const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            growthCount[yearMonth] = (growthCount[yearMonth] || 0) + 1;
        });
        const growth = Object.entries(growthCount).sort().map(([name, value]) => ({ name, value })).slice(-6);

        // 6. Active in last 24h
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        const activeLast24h = users.filter(u => {
            if (!u.lastLogin) return false;
            const last = u.lastLogin.toDate ? u.lastLogin.toDate() : new Date(u.lastLogin);
            return (now.getTime() - last.getTime()) < oneDay;
        }).length;

        const breakdown = Object.entries(activityTypeCount).map(([name, value]) => ({ name, value }));

        return NextResponse.json({
            totalUsers,
            totalSessions,
            totalMiles: Number(totalMiles) || 0,
            totalSteps: Number(totalSteps) || 0,
            activeLast24h,
            breakdown,
            growth
        });

    } catch (error: any) {
        console.error("Admin Stats Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
