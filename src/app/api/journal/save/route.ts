import { db } from "@/db";
import { journals, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/auth-utils";

export async function POST(req: Request) {
    try {
        console.log("=== API /journal/save CALLED ===");
        
        const auth = await verifyFirebaseToken();
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const userId = auth.userId;

        const body = await req.json();
        const { id, title, content, type = "journal", imageUrls, media } = body;

        if (!content && !title && (!imageUrls || imageUrls.length === 0) && (!media || media.length === 0)) {
            console.log("Validation Failed: Empty entry");
            return NextResponse.json({ error: "Empty entry" }, { status: 400 });
        }

        const finalMedia = media || (imageUrls ? imageUrls.map((url: string) => ({ url, type: "image" })) : null);

        // Ensure user exists, but do not fail the journal save if it hits unique constraint issues
        try {
            await db.insert(users).values({
                id: userId,
                email: body.email || "user@example.com", 
            }).onConflictDoNothing();
        } catch (dbError: any) {
            console.warn("[JOURNAL_SAVE] Non-fatal user insertion issue:", dbError.message);
        }

        if (id) {
            console.log(`[JOURNAL_SAVE_ATTEMPT] Updating entry ${id}...`);
            await db.update(journals).set({
                title: title ?? null,
                content: content ?? null,
                type,
                media: finalMedia ?? null,
                updatedAt: new Date()
            }).where(and(eq(journals.id, id), eq(journals.userId, userId)));
            
            console.log(`[JOURNAL_SAVE_SUCCESS] Updated entry ${id}`);
            return NextResponse.json({ success: true, id });
        } else {
            console.log(`[JOURNAL_SAVE_ATTEMPT] Creating new entry for user ${userId}...`);
            const newId = crypto.randomUUID();
            await db.insert(journals).values({
                id: newId,
                userId,
                title: title ?? "",
                content: content ?? "",
                type,
                media: finalMedia ?? null,
                date: new Date(),
            });
            console.log(`[JOURNAL_SAVE_SUCCESS] Created entry ${newId}`);
            return NextResponse.json({ success: true, id: newId });
        }

    } catch (error: any) {
        console.error("=== Journal Save CRITICAL ERROR ===");
        console.error("Error Message:", error.message);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
