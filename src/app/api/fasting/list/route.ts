import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { fastingSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const userLogs = await db.query.fastingSessions.findMany({
            where: eq(fastingSessions.userId, userId),
            orderBy: [desc(fastingSessions.endTime)],
            limit: 20
        });

        const logs = userLogs.map((log: any) => ({
            id: log.id,
            startTime: log.startTime?.toISOString(),
            endTime: log.endTime?.toISOString(),
            durationMinutes: (log.duration || 0) / 60,
            goalHours: log.goal,
            type: "Water Fast", // Fallback, not stored in PG schema yet
            completedAt: log.createdAt?.toISOString(),
        }));

        return NextResponse.json({ logs });

    } catch (error: any) {
        console.error("Fasting List Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
