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

        // Fetch all challenges
        const snapshot = await adminDb.collection("challenges")
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();

        const challenges = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isJoined: (doc.data().participants || []).includes(userId)
        }));

        return NextResponse.json({ challenges });
    } catch (error: any) {
        console.error("Challenges GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const body = await req.json();
        const { title, type, goal, duration } = body;

        if (!title || !type || !goal || !duration) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const startDate = new Date();
        const endDate = new Date();
        if (duration === "week") endDate.setDate(endDate.getDate() + 7);
        else endDate.setMonth(endDate.getMonth() + 1);

        const newChallenge = {
            title,
            type,
            goal: Number(goal),
            duration,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            creatorId: userId,
            participants: [userId],
            createdAt: new Date().toISOString()
        };

        const docRef = await adminDb.collection("challenges").add(newChallenge);

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error: any) {
        console.error("Challenges POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    // Join logic
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const { challengeId } = await req.json();
        if (!challengeId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        const docRef = adminDb.collection("challenges").doc(challengeId);
        const doc = await docRef.get();

        if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const participants = doc.data()?.participants || [];
        if (!participants.includes(userId)) {
            await docRef.update({
                participants: [...participants, userId]
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
