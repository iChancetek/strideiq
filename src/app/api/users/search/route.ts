import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");
        const currentUserId = searchParams.get("userId");

        if (!query || query.length < 3) {
            return NextResponse.json({ users: [] });
        }

        // Search by email or displayName
        // Firestore doesn't accept "OR" queries across different fields easily without multiple queries.
        // We will do two parallel queries (simple search).

        // Note: Full text search usually requires Algolia/MeiliSearch with Firestore. 
        // We will do a simple prefix match on 'email' and 'displayName' for this MVP.
        // Firestore requires indexes for this.

        const usersRef = adminDb.collection("users");

        // 1. Search Email (exact or prefix if we set it up, typically exact for privacy)
        // Let's assume exact email match for privacy first, or displayName prefix.

        // Let's just search Display Name for now as it's more "social".
        const nameQuery = usersRef
            .where("displayName", ">=", query)
            .where("displayName", "<=", query + "\uf8ff")
            .limit(10)
            .get();

        const [nameSnap] = await Promise.all([nameQuery]);

        const results: any[] = [];
        nameSnap.forEach(doc => {
            if (doc.id === currentUserId) return;
            const data = doc.data();
            results.push({
                uid: doc.id,
                displayName: data.displayName,
                photoURL: data.photoURL,
                // Do not leak email
            });
        });

        return NextResponse.json({ users: results });

    } catch (error: any) {
        console.error("User Search Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
