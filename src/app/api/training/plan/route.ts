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