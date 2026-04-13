import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const activityId = searchParams.get("activityId");

        if (!activityId) {
            return NextResponse.json({ error: "Activity ID required" }, { status: 400 });
        }

        const snapshot = await adminDb.collection("entries").doc(activityId).collection("likes").orderBy("createdAt", "desc").get();
        const likes = snapshot.docs.map(doc => doc.data());

        return NextResponse.json({ likes });
    } catch (error: any) {
        console.error("Fetch Likes Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}