import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");
        const currentUserId = searchParams.get("userId");

        if (!query || query.length < 2) {
            return NextResponse.json({ users: [] });
        }

        // Search by email or displayName
        // Firestore doesn't accept "OR" queries across different fields easily without multiple queries.
        // We will do two parallel queries (simple search).

        // Note: Full text search usually requires Algolia/MeiliSearch with Firestore. 
        // We will do a simple prefix match on 'email' and 'displayName' for this MVP.
        // Firestore requires indexes for this.

        const isEmail = query.includes("@");
        const usersRef = adminDb.collection("users");
        let results: any[] = [];

        if (isEmail) {
            // 1. Search Email (exact)
            const emailSnap = await usersRef.where("email", "==", query.toLowerCase()).limit(1).get();
            emailSnap.forEach(doc => {
                if (doc.id === currentUserId) return;
                const data = doc.data();
                results.push({
                    uid: doc.id,
                    displayName: data.displayName || data.name || "Runner",
                    photoURL: data.photoURL || null,
                });
            });
        }

        // 2. Search Display Name (prefix) - Case sensitivity is a Firestore limitation
        // For better results, we search the provided case AND capitalized first letter
        const capitalized = query.charAt(0).toUpperCase() + query.slice(1);
        
        const [nameSnap, capSnap] = await Promise.all([
            usersRef.where("displayName", ">=", query).where("displayName", "<=", query + "\uf8ff").limit(10).get(),
            usersRef.where("displayName", ">=", capitalized).where("displayName", "<=", capitalized + "\uf8ff").limit(10).get()
        ]);

        const seen = new Set(results.map(r => r.uid));
        
        const processSnap = (snap: any) => {
            snap.forEach((doc: any) => {
                if (doc.id === currentUserId || seen.has(doc.id)) return;
                seen.add(doc.id);
                const data = doc.data();
                results.push({
                    uid: doc.id,
                    displayName: data.displayName || data.name || "Runner",
                    photoURL: data.photoURL || null,
                });
            });
        };

        processSnap(nameSnap);
        processSnap(capSnap);

        return NextResponse.json({ users: results });

    } catch (error: any) {
        console.error("User Search Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
