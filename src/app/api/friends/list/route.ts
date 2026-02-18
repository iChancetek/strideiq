import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
        }

        // Query friends where user is requester OR receiver
        // Firestore doesn't support logical OR queries easily. run two.

        const [sent, received] = await Promise.all([
            adminDb.collection("friends").where("requesterId", "==", userId).where("status", "==", "accepted").get(),
            adminDb.collection("friends").where("receiverId", "==", userId).where("status", "==", "accepted").get()
        ]);

        const friendIds = new Set<string>();
        sent.forEach(doc => friendIds.add(doc.data().receiverId));
        received.forEach(doc => friendIds.add(doc.data().requesterId));

        if (friendIds.size === 0) {
            return NextResponse.json({ friends: [] });
        }

        // Fetch profiles
        // "in" query limited to 10 items. Batching required for production.
        // For MVP, limit to first 10 friends or implement loop.
        const ids = Array.from(friendIds).slice(0, 10);

        if (ids.length === 0) return NextResponse.json({ friends: [] });

        const profilesSnap = await adminDb.collection("users").where(adminDb.doc("uid").path, "in", ids).get();
        // Wait, document ID query is FieldPath.documentId()
        // Or simpler: getAll

        const userRefs = ids.map(id => adminDb.collection("users").doc(id));
        const userDocs = await adminDb.getAll(...userRefs);

        const friends = userDocs.map(doc => ({
            uid: doc.id,
            displayName: doc.data()?.displayName || "Unknown",
            photoURL: doc.data()?.photoURL
        }));

        return NextResponse.json({ friends });

    } catch (error: any) {
        console.error("Friend List Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
