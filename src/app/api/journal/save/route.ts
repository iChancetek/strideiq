import { adminDb } from "@/lib/firebase/admin";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
    try {
        console.log("=== API /journal/save CALLED ===");
        const body = await req.json();
        const { id, title, content, type = "journal", imageUrls, media, userId: bodyUserId } = body;
        console.log("Parsed body. ID:", id, "UserId:", bodyUserId, "Media count:", media?.length);

        let userId = bodyUserId;
        if (!userId) {
            console.log("Validation Failed: Unauthorized");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!content && !title && (!imageUrls || imageUrls.length === 0) && (!media || media.length === 0)) {
            console.log("Validation Failed: Empty entry");
            return NextResponse.json({ error: "Empty entry" }, { status: 400 });
        }

        console.log("Validation passed. Finalizing media array...");

        // Combine legacy imageUrls into media array for DB storage if needed, or store them separately.
        const finalMedia = media || (imageUrls ? imageUrls.map((url: string) => ({ url, type: "image" })) : null);
        console.log("Final media array derived.");

        console.log("Attempting to get adminDb collection ref...");
        // Ensure the parent users/{uid} doc exists before writing to subcollections
        // This prevents NOT_FOUND errors for new users whose profile hasn't synced yet
        const userDocRef = adminDb.collection("users").doc(userId);
        await userDocRef.set({ uid: userId }, { merge: true });

        // If ID exists, update. Else create new.
        const collectionRef = userDocRef.collection("journal_entries");
        console.log("adminDb collection ref obtained.");

        if (id) {
            console.log(`[JOURNAL_SAVE_ATTEMPT] Updating document ${id}...`);
            await collectionRef.doc(id).set({
                title: title ?? null,
                content: content ?? null,
                type,
                media: finalMedia ?? null,
                updatedAt: Timestamp.now(),
            }, { merge: true });
            console.log(`[JOURNAL_SAVE_SUCCESS] Updated document ${id}`);
            return NextResponse.json({ success: true, id });
        } else {
            console.log(`[JOURNAL_SAVE_ATTEMPT] Creating new document for user ${userId}...`);
            const docRef = await collectionRef.add({
                title: title ?? "",
                content: content ?? "",
                type,
                media: finalMedia ?? null,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
            console.log(`[JOURNAL_SAVE_SUCCESS] Created document ${docRef.id}`);
            return NextResponse.json({ success: true, id: docRef.id });
        }

    } catch (error: any) {
        console.error("=== Journal Save CRITICAL ERROR ===");
        console.error(error);
        console.error(error.stack);
        return NextResponse.json({ error: error.message || "Internal Server Error", stack: error.stack }, { status: 500 });
    }
}
