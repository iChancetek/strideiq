import { adminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) {
            // For client components fetching on load, we might handle auth differently (e.g. session cookie), 
            // but here we expect Bearer token from client component fetch
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const snapshot = await adminDb.collection("users").doc(userId).collection("journal_entries")
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();

        const entries = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert timestamps to strings for serialization
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }));

        return NextResponse.json({ entries });

    } catch (error: any) {
        console.error("Journal List Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
