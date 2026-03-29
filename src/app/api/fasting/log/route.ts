import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { fastingSessions, users } from "@/db/schema";

export async function POST(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const body = await req.json();
        const { startTime, endTime, durationMinutes, type, goalHours } = body;

        if (!startTime || !endTime || durationMinutes === undefined) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Ensure user exists (foreign key constraint)
        await db.insert(users).values({
            id: userId,
            email: "user@example.com", 
        }).onConflictDoNothing();

        const newId = crypto.randomUUID();

        await db.insert(fastingSessions).values({
            id: newId,
            userId,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            duration: durationMinutes * 60, // Convert minutes to seconds for the db schema
            goal: goalHours || 0,
            status: 'completed',
            createdAt: new Date(),
        });

        return NextResponse.json({ success: true, id: newId });

    } catch (error) {
        console.error("Fasting Log Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
