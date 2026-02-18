import { NextResponse } from "next/server";
import { createActivitySchema } from "@/lib/validators/activity";
import { updateUserStats } from "@/lib/server/activity-service";
import { db } from "@/lib/firebase/config"; // Using client SDK config
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Validation
        const validation = createActivitySchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Invalid activity data", details: validation.error }, { status: 400 });
        }

        const { userId } = await req.json(); // In a real app, verify auth token/session here!
        // For this phase, we'll assume the client sends the userId (less secure, but faster for prototype)
        // ideally: const session = await getSession(); const userId = session.user.id;

        // However, since we are using Client SDK in the service, we might need to rely on the client authenticating 
        // OR we pass the user ID. 
        // IMPORTANT: The `updateUserStats` uses `runTransaction`. 

        // Let's grab the user ID from the body for now, but strict auth is in the "Security" todo.
        // Actually, let's look at the request headers for a token if we were doing strict auth.
        // For now, to keep it simple and working with the existing firestore rules (which might need 'request.auth'),
        // we might be blocked if we run this on server without a service account.

        // RE-EVALUATION: Using Client SDK on server (Node.js) without a logged-in user context 
        // will fail if Firestore rules require 'auth != null'.
        // We MUST use firebase-admin or pass a token. 
        // Given we are installing firebase-admin, let's prepare to switch to it if this fails.
        // But let's try to proceed with the data provided.

        if (!body.userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 401 });
        }

        const activityData = validation.data;
        const activityDate = new Date(activityData.date);

        // 2. Save Activity
        const docRef = await addDoc(collection(db, "users", body.userId, "activities"), {
            ...activityData,
            date: Timestamp.fromDate(activityDate),
            createdAt: serverTimestamp(),
            // Calculated fields
            pace: (activityData.duration / 60) / activityData.distance // min/mile roughly, or just store seconds per mile
        });

        // 3. Trigger Aggregation
        await updateUserStats(body.userId, {
            ...activityData,
            date: activityDate
        });

        return NextResponse.json({ success: true, activityId: docRef.id });

    } catch (error: any) {
        console.error("Activity Creation Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
