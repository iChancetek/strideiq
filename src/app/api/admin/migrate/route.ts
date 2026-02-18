import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { updateUserStats } from "@/lib/server/activity-service";

export async function POST(req: Request) {
    try {
        // 1. Security Check (Basic secret key for prototype)
        // In production, use Firebase Auth Custom Claims (admin) or proper middleware
        const { secret } = await req.json();
        if (secret !== process.env.ADMIN_SECRET_KEY && secret !== "strideiq-admin-setup") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const usersSnapshot = await adminDb.collection("users").get();
        let totalUpdated = 0;

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const activitiesSnapshot = await adminDb.collection("users").doc(userId).collection("activities").get();

            if (activitiesSnapshot.empty) continue;

            console.log(`Migrating ${activitiesSnapshot.size} activities for user ${userId}...`);

            for (const activityDoc of activitiesSnapshot.docs) {
                const data = activityDoc.data();

                // Check if already migrated
                if (data.month && data.year) continue;

                // Fix Date (Timestamp to Date)
                const activityDate = data.date.toDate ? data.date.toDate() : new Date(data.date);

                // Trigger aggregation service (which handles leaderboards and stats)
                // We pass the activity data roughly matching the schema
                // Note: updateUserStats expects 'distance' and 'duration'.
                await updateUserStats(userId, {
                    ...data,
                    date: activityDate,
                    distance: data.distance || 0,
                    duration: data.duration || 0
                });

                // Update the activity doc itself with new metadata
                const dateObj = new Date(activityDate);
                const monthKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;

                await activityDoc.ref.update({
                    month: monthKey,
                    year: dateObj.getFullYear(),
                    migratedAt: new Date()
                });

                totalUpdated++;
            }
        }

        return NextResponse.json({ success: true, updated: totalUpdated });

    } catch (error: any) {
        console.error("Migration Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
