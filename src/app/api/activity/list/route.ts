import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const limitParam = searchParams.get("limit");
        if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });
        
        const limitVal = limitParam ? parseInt(limitParam) : 50;
        const snapshot = await adminDb.collection("entries")
            .where("userId", "==", userId)
            .limit(limitVal)
            .get();
            
        // Sorting manually since firestore needs composite index if we combine where and orderBy
        let activities = snapshot.docs.map(doc => ({
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