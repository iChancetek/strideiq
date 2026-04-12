import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const type = searchParams.get("type") || "global"; // "global" | "friends"

        // Default to current month
        const now = new Date();
        const defaultPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
        const period = searchParams.get("period") || defaultPeriod;

        if (!userId && type === "friends") {
            return NextResponse.json({ error: "User ID required for friends leaderboard" }, { status: 400 });
        }

        const leaderboardRef = adminDb.collection("stepsLeaderboards").doc(period).collection("entries");
        const query = leaderboardRef.orderBy("totalSteps", "desc").limit(50);

        if (type === "friends" && userId) {
            // Fetch friend IDs
            const [sent, received] = await Promise.all([
                adminDb.collection("friends").where("requesterId", "==", userId).where("status", "==", "accepted").get(),
                adminDb.collection("friends").where("receiverId", "==", userId).where("status", "==", "accepted").get(),
            ]);

            const friendIds = new Set<string>([userId]); // Include self
            sent.forEach((doc) => friendIds.add(doc.data().receiverId));
            received.forEach((doc) => friendIds.add(doc.data().requesterId));

            if (friendIds.size > 0) {
                const idsArray = Array.from(friendIds).slice(0, 30);
                const refs = idsArray.map((id) => leaderboardRef.doc(id));
                const docs = await adminDb.getAll(...refs);

                const entries = docs
                    .filter((doc) => doc.exists)
                    .map((doc) => doc.data())
                    .sort((a, b) => (b?.totalSteps || 0) - (a?.totalSteps || 0));

                return NextResponse.json({ entries });
            } else {
                return NextResponse.json({ entries: [] });
            }
        }

        // Global query
        const snapshot = await query.get();
        const entries = snapshot.docs.map((doc) => doc.data());

        return NextResponse.json({ entries });
    } catch (error: any) {
        console.error("Steps Leaderboard API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
