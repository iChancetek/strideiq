import { adminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        // Fetch soft-deleted entries from the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const snapshot = await adminDb.collection("entries")
            .where("userId", "==", userId)
            .where("isDeleted", "==", true)
            .where("deletedAt", ">=", thirtyDaysAgo)
            .get();

        const deletedItems = snapshot.docs.map(doc => {
            const data = doc.data();
            const deletedAt = data.deletedAt?.toDate ? data.deletedAt.toDate() : new Date(data.deletedAt);
            
            // Calculate days remaining
            const expiresAt = new Date(deletedAt);
            expiresAt.setDate(expiresAt.getDate() + 30);
            const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 3600 * 24)));

            return {
                id: doc.id,
                ...data,
                deletedAt: deletedAt.toISOString(),
                daysLeft,
            };
        }).sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

        return NextResponse.json({ deletedItems });
    } catch (error: any) {
        console.error("Deleted Items List Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
