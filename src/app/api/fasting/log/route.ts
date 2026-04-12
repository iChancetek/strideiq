import { adminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

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

        if (!startTime || !endTime || !durationMinutes) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Save to top-level 'entries' collection (standardized timeline structure)
        const entriesRef = adminDb.collection("entries");
        const docRef = await entriesRef.add({
            userId,
            type: "Fasting",
            startTime,
            endTime,
            duration: durationMinutes, // standardized to duration
            goal: goalHours || 16,
            date: new Date(endTime), // standardized timestamp
            notes: body.notes || "Fasting Session",
            createdAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, id: docRef.id });

    } catch (error) {
        console.error("Fasting Log Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
