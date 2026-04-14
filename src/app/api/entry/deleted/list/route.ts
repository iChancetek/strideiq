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

        // Attempt a precise query first (requires composite index)
        let snapshot;
        try {
            snapshot = await adminDb.collection("entries")
                .where("userId", "==", userId)
                .where("isDeleted", "==", true)
                .get();
        } catch (indexErr: any) {
            console.warn("[Trash API] Composite query failed, falling back to memory filtering:", indexErr.message);
            // Fallback: Query all deleted items and filter by user in memory 
            // This is safe because the number of deleted items in the last 30 days is typically small
            const allDeleted = await adminDb.collection("entries")
                .where("isDeleted", "==", true)
                .get();
            
            // Filter manually
            snapshot = {
                docs: allDeleted.docs.filter(doc => doc.data().userId === userId)
            };
        }
 
        const deletedItems = snapshot.docs.map(doc => {
            const data = doc.data();
            const deletedAt = data.deletedAt?.toDate ? data.deletedAt.toDate() : (data.deletedAt ? new Date(data.deletedAt) : new Date());
            
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
        })
        .filter(item => {
            // Keep items within the 30-day window
            return item.daysLeft > 0;
        })
        .sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
 
        return NextResponse.json({ deletedItems });

    } catch (error: any) {
        console.error("Deleted Items List Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
