import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const type = searchParams.get("type") || "global"; // "global" | "friends"

        // Default to current month if not specified
        const now = new Date();
        const defaultPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        const period = searchParams.get("period") || defaultPeriod;

        if (!userId && type === "friends") {
            return NextResponse.json({ error: "User ID required for friends leaderboard" }, { status: 400 });
        }

        const leaderboardRef = adminDb.collection("leaderboards").doc(period).collection("entries");
        let query = leaderboardRef.orderBy("totalMiles", "desc").limit(50);

        if (type === "friends" && userId) {
            // 1. Fetch Friends List
            // We duplicate the friend fetching logic from /api/friends/list or abstract it.
            // For now, let's just fetch accepted friend relations.
            const [sent, received] = await Promise.all([
                adminDb.collection("friends").where("requesterId", "==", userId).where("status", "==", "accepted").get(),
                adminDb.collection("friends").where("receiverId", "==", userId).where("status", "==", "accepted").get()
            ]);

            const friendIds = new Set<string>([userId]); // Include self
            sent.forEach(doc => friendIds.add(doc.data().receiverId));
            received.forEach(doc => friendIds.add(doc.data().requesterId));

            if (friendIds.size > 0) {
                // Firestore 'in' limit is 10 (or 30? check docs. 30 in some versions, 10 in older). 
                // Creating a friends leaderboard in Firestore is tricky with "orderBy". 
                // We might need to fetch all top entries and filter in memory if the dataset is small, 
                // OR fetch specific docs for each friend if N is small.

                // Better approach for small N (<30): Fetch doc for each friend from the leaderboard collection.
                const idsArray = Array.from(friendIds).slice(0, 30); // Cap at 30 for MVP

                const refs = idsArray.map(id => leaderboardRef.doc(id));
                const docs = await adminDb.getAll(...refs);

                const entries = docs
                    .filter(doc => doc.exists)
                    .map(doc => doc.data())
                    .sort((a, b) => (b?.totalMiles || 0) - (a?.totalMiles || 0)); // Sort in memory

                return NextResponse.json({ entries });
            } else {
                return NextResponse.json({ entries: [] });
            }
        }

        // Global Query
        const snapshot = await query.get();
        const entries = snapshot.docs.map(doc => doc.data());

        return NextResponse.json({ entries });

    } catch (error: any) {
        console.error("Leaderboard API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
