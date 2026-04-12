import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

export async function GET(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;
        
        const { searchParams } = new URL(req.url);
        const limitParam = searchParams.get("limit");
        const limitVal = limitParam ? parseInt(limitParam) : 50;

        const snapshot = await adminDb.collection("entries")
            .where("userId", "==", userId)
            .where("type", "!=", "journal") // Exclude journals from activity feed
            .limit(limitVal)
            .get();
            
        // Sorting manually since firestore needs composite index if we combine where and orderBy
        let activities = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate ? doc.data().date.toDate() : doc.data().date
        }));
        
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        return NextResponse.json({ 
            activities,
            meta: { limit: limitVal, count: activities.length }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}