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
            if (process.env.NODE_ENV === "development") {
                console.warn("[JOURNAL_LIST] Auth failed in DEV mode. Bypassing to default test user.");
                userId = "test_user_id"; 
            } else {
                console.warn("[JOURNAL_LIST] Rejecting request: Auth failure in Production");
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }
        
        const db = getAdminDb();
        console.log(`[JOURNAL_LIST] Request from User: ${userId} | Project: ${db.app.options.projectId}`);

        // Query top-level 'entries' collection
        const entryRef = db.collection("entries");
        console.log(`[JOURNAL_LIST] Querying collection: ${entryRef.path}`);

        const snapshot = await entryRef
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .limit(100)
            .get();

        console.log(`[JOURNAL_LIST] SQL FOUND ${snapshot.size} entries for user ${userId}`);

        const entries = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((entry: any) => entry.type === "journal" || entry.type === "Reflection" || (!entry.type && entry.content))
            .map((entry: any) => ({
                ...entry,
                createdAt: entry.createdAt || entry.date || new Date().toISOString(),
                updatedAt: entry.updatedAt || new Date().toISOString(),
            }));

        return NextResponse.json({ entries });

    } catch (error: any) {
        console.error("Journal List Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
