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

        const snapshot = await adminDb.collection("trainingPlans")
            .where("userId", "==", userId)
            .limit(1)
            .get();

        return NextResponse.json({ 
            plan: snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } 
        });
    } catch (e: any) {
        console.error("Training Plan Error:", e);
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const { weekIndex, workoutIndex, completed, note } = await req.json();

        // Use userId as doc ID for active plan
        const planRef = adminDb.collection("trainingPlans").doc(userId);
        const planDoc = await planRef.get();
        
        if (!planDoc.exists) {
            return NextResponse.json({ error: "No active plan found" }, { status: 404 });
        }

        const planData = planDoc.data();
        if (!planData || !planData.weeks || !planData.weeks[weekIndex]) {
            return NextResponse.json({ error: "Invalid plan index" }, { status: 400 });
        }

        // Update the specific workout
        const updatedWeeks = [...planData.weeks];
        updatedWeeks[weekIndex].workouts[workoutIndex] = {
            ...updatedWeeks[weekIndex].workouts[workoutIndex],
            completed,
            note: note !== undefined ? note : (updatedWeeks[weekIndex].workouts[workoutIndex].note || "")
        };

        await planRef.update({
            weeks: updatedWeeks,
            lastUpdated: Date.now()
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Update Plan Error:", e);
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
    }
}