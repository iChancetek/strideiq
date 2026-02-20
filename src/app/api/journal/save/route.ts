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
        // If ID exists, update. Else create new.
        const collectionRef = adminDb.collection("users").doc(userId).collection("journal_entries");
        console.log("adminDb collection ref obtained.");

        if (id) {
            console.log(`Updating document ${id}...`);
            await collectionRef.doc(id).update({
                title,
                content,
                media: finalMedia,
                updatedAt: Timestamp.now()
            });
            console.log(`Update successful ${id}`);
            return NextResponse.json({ success: true, id });
        } else {
            console.log(`Creating new document...`);
            const docRef = await collectionRef.add({
                title,
                content,
                type,
                media: finalMedia,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
            console.log(`Creation successful ID: ${docRef.id}`);
            return NextResponse.json({ success: true, id: docRef.id });
        }

    } catch (error: any) {
        console.error("=== Journal Save CRITICAL ERROR ===");
        console.error(error);
        console.error(error.stack);
        return NextResponse.json({ error: error.message || "Internal Server Error", stack: error.stack }, { status: 500 });
    }
}
