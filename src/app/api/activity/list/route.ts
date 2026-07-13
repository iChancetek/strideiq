import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

/**
 * Safely convert a Firestore Timestamp (or any date-like value) to an ISO
 * string.  Returns `undefined` when the value is missing or un-parseable so
 * we never send a raw `{ _seconds, _nanoseconds }` object to the client.
 */
function toISOString(val: any): string | undefined {
    if (!val) return undefined;
    // Firestore admin Timestamp → has a `.toDate()` method
    if (typeof val.toDate === "function") return val.toDate().toISOString();
    // Already a JS Date
    if (val instanceof Date) return val.toISOString();
    // Serialized Firestore timestamp shape `{ _seconds, _nanoseconds }`
    if (typeof val._seconds === "number") return new Date(val._seconds * 1000).toISOString();
    // Plain ISO string or epoch number
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
}

export async function GET(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;
        
        const { searchParams } = new URL(req.url);
        const limitParam = searchParams.get("limit");
        const limitVal = limitParam ? parseInt(limitParam) : 500;

        const snapshot = await adminDb.collection("entries")
            .where("userId", "==", userId)
            .limit(limitVal)
            .get();
            
        // Sorting manually since firestore needs composite index if we combine where and orderBy
        let activities = snapshot.docs
            .map((doc: QueryDocumentSnapshot) => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    // Serialize every Timestamp field to a clean ISO string
                    date: toISOString(data.date),
                    startTime: toISOString(data.startTime),
                    endTime: toISOString(data.endTime),
                    createdAt: toISOString(data.createdAt),
                };
            })
            .filter((a: any) => a.isDeleted !== true);
        
        activities.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        
        return NextResponse.json({ 
            activities,
            meta: { limit: limitVal, count: activities.length }
        });
    } catch (error: any) {
        console.error("[ACTIVITY_LIST_ERROR]:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}