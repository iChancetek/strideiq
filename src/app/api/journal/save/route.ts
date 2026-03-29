import { db } from "@/db";
import { journals, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        console.log("=== API /journal/save CALLED ===");
        const body = await req.json();
        const { id, title, content, type = "journal", imageUrls, media, userId } = body;

        if (!userId) {
            console.log("Validation Failed: Unauthorized");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!content && !title && (!imageUrls || imageUrls.length === 0) && (!media || media.length === 0)) {
            console.log("Validation Failed: Empty entry");
            return NextResponse.json({ error: "Empty entry" }, { status: 400 });
        }

        const finalMedia = media || (imageUrls ? imageUrls.map((url: string) => ({ url, type: "image" })) : null);

        // Ensure user exists (foreign key constraint)
        await db.insert(users).values({
            id: userId,
            email: "user@example.com", 
        }).onConflictDoNothing();

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
