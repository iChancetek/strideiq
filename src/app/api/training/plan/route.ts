import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const snapshot = await adminDb.collection("trainingPlans").where("userId", "==", userId).limit(1).get();
        return NextResponse.json({ plan: snapshot.empty ? null : snapshot.docs[0].data() });
    } catch (e) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}