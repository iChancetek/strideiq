import { db } from "@/db";
import { journals, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/auth-utils";
import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
    try {
        const auth = await verifyFirebaseToken();
        if (auth.error || !auth.userId) {
            return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
        }
        
        const userId = auth.userId;
        console.log(`[Journal List] Starting hybrid fetch for user: ${userId}`);

        // 1. Fetch from Postgres (New Source)
        const pgEntries = await db.query.journals.findMany({
            where: eq(journals.userId, userId),
            orderBy: [desc(journals.date)],
        });

        // 2. Fetch from Firestore (Legacy Source)
        let firestoreEntries: any[] = [];
        try {
            const snapshot = await adminDb.collection("users").doc(userId).collection("journals")
                .orderBy("createdAt", "desc")
                .get();
            
            firestoreEntries = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    userId,
                    title: data.title || "",
                    content: data.content || "",
                    type: data.type || "journal",
                    date: data.createdAt?.toDate() || new Date(data.date) || new Date(),
                    media: data.imageUrls ? data.imageUrls.map((url: string) => ({ url, type: "image" })) : (data.media || []),
                    isLegacy: true
                };
            });
        } catch (fsErr) {
            console.warn("[Journal List] Firestore fetch failed (might not have legacy data):", fsErr);
        }

        // 3. Merge & Deduplicate
        const journalMap = new Map();
        
        // Add Postgres entries first (Source of Truth)
        pgEntries.forEach(entry => journalMap.set(entry.id, entry));
        
        // Add Firestore entries (only if missing from Postgres)
        const migrationPromises: Promise<any>[] = [];
        firestoreEntries.forEach(entry => {
            if (!journalMap.has(entry.id)) {
                journalMap.set(entry.id, entry);
                
                // 4. Auto-Migrate to Postgres
                migrationPromises.push((async () => {
                    try {
                        console.log(`[Journal List] Migrating entry ${entry.id} to Postgres...`);
                        
                        // Ensure user exists
                        await db.insert(users).values({ id: userId, email: "user@example.com" }).onConflictDoNothing();
                        
                        await db.insert(journals).values({
                            id: entry.id,
                            userId,
                            title: entry.title,
                            content: entry.content,
                            type: entry.type,
                            date: entry.date,
                            media: entry.media,
                        }).onConflictDoNothing();
                    } catch (migErr) {
                        console.error(`[Journal List] Migration failed for ${entry.id}:`, migErr);
                    }
                })());
            }
        });

        // Wait for migration in background (don't block the response)
        Promise.all(migrationPromises).then(() => {
            if (migrationPromises.length > 0) console.log(`[Journal List] Migrated ${migrationPromises.length} entries.`);
        });

        // 5. Final Sorted List
        const allEntries = Array.from(journalMap.values()).sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        console.log(`[Journal List] Returning ${allEntries.length} total entries (${pgEntries.length} PG, ${firestoreEntries.length} FS)`);
        return NextResponse.json(allEntries);
    } catch (error: any) {
        console.error("[Journal List API] CRITICAL Error:", error);
        return NextResponse.json({ error: "Internal Server Error: " + error.message }, { status: 500 });
    }
}
