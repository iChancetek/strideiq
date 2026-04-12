import { adminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const body = await req.json();
        const { id, title, content, type = "journal", imageUrls, media } = body;

        if (!content && !title && (!imageUrls || imageUrls.length === 0) && (!media || media.length === 0)) {
            console.log("Validation Failed: Empty entry");
            return NextResponse.json({ error: "Empty entry" }, { status: 400 });
        }

        const finalMedia = media || (imageUrls ? imageUrls.map((url: string) => ({ url, type: "image" })) : null);

        // Ensure parent user doc exists (prevents NOT_FOUND on new users)
        await adminDb.collection("users").doc(userId).set({ uid: userId }, { merge: true });

        // Write to the top-level 'entries' collection (matches Firestore schema)
        const entriesRef = adminDb.collection("entries");

        if (id) {
            console.log(`[JOURNAL_SAVE_ATTEMPT] Updating entry ${id}...`);
            await entriesRef.doc(id).set({
                userId,
                title: title ?? null,
                content: content ?? null,
                type,
                media: finalMedia ?? null,
                updatedAt: Timestamp.now(),
            }, { merge: true });
            console.log(`[JOURNAL_SAVE_SUCCESS] Updated entry ${id}`);
            return NextResponse.json({ success: true, id });
        } else {
            console.log(`[JOURNAL_SAVE_ATTEMPT] Creating new entry for user ${userId}...`);
            const docRef = await entriesRef.add({
                userId,
                title: title ?? "",
                content: content ?? "",
                type,
                media: finalMedia ?? null,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
            console.log(`[JOURNAL_SAVE_SUCCESS] Created entry ${docRef.id}`);
            return NextResponse.json({ success: true, id: docRef.id });
        }

    } catch (error: any) {
        console.error("=== Journal Save CRITICAL ERROR ===");
        console.error("Error Code:", error.code);
        console.error("Error Details:", error.details);
        console.error("Error Message:", error.message);
        
        return NextResponse.json({ 
            error: error.message || "Internal Server Error",
            code: error.code,
            details: error.details
        }, { status: 500 });
    }
}
