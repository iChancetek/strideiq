import { getAdminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { NextResponse } from "next/server";

console.log("[JOURNAL_LIST] Route file loaded");

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        const idToken = authHeader?.split("Bearer ")[1];
        let userId: string;
        
        try {
            if (!idToken) throw new Error("Missing token");
            const decodedToken = await getAuth().verifyIdToken(idToken);
            userId = decodedToken.uid;
        } catch (authError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const db = getAdminDb();
        console.log(`[JOURNAL_LIST] Request from User: ${userId} | Project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);

        // Query without orderBy so docs missing createdAt field are still returned
        const entryRef = db.collection("entries");
        const snapshot = await entryRef
            .where("userId", "==", userId)
            .limit(100)
            .get();

        console.log(`[JOURNAL_LIST] Found ${snapshot.size} total entries for user ${userId}`);

        const entries = snapshot.docs
            .map(doc => {
                const data = doc.data();
                // Normalize createdAt — could be Firestore Timestamp, ISO string, or missing
                const rawCreatedAt = data.createdAt;
                const createdAt = rawCreatedAt?._seconds
                    ? new Date(rawCreatedAt._seconds * 1000).toISOString()
                    : rawCreatedAt?.toDate
                        ? rawCreatedAt.toDate().toISOString()
                        : typeof rawCreatedAt === 'string'
                            ? rawCreatedAt
                            : data.date || new Date().toISOString();
                return { id: doc.id, ...data, createdAt, updatedAt: data.updatedAt || createdAt };
            })
            .filter((entry: any) => entry.type === "journal" || entry.type === "Reflection" || entry.type === "Journal" || (!entry.type && entry.content))
            .filter((entry: any) => entry.isDeleted !== true)
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ entries });

    } catch (error: any) {
        console.error("Journal List Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
