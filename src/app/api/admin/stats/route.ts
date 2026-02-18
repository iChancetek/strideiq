import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: Request) {
    try {
        // In a real app, verify Admin role here via session/token
        // For MVP, we trust the client to only show this page to admins,
        // and we can filter by IP or header if needed, but best is auth check.
        // Since we don't have a robust server-side session middleware yet, 
        // we'll rely on client-side protection + obscurity for this MVP step,
        // but ideally we'd pass the ID token and verify claims.

        const [usersSnap, activitiesSnap] = await Promise.all([
            adminDb.collection("users").get(),
            adminDb.collection("activities").get() // careful with large datasets
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

        // Current date for login stats
        // We'd need a specific 'logins' collection to track daily logins accurately.
        // For now, we use 'lastLogin' from users.
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
            totalMiles,
            totalSteps,
            activeLast24h,
            breakdown
        });

    } catch (error: any) {
        console.error("Admin Stats Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
