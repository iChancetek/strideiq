import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { headers } from "next/headers";

export async function GET(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const statsSnap = await adminDb.collection("users").doc(userId).collection("stats").doc("allTime").get();
        return NextResponse.json(statsSnap.data() || {});
    } catch (e: any) {
        console.error("[STATS_ERROR]:", e);
        return NextResponse.json({ error: e.message || "Internal Error" }, { status: 500 });
    }
}