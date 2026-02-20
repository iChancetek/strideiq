import { adminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, title, content, type = "journal", imageUrls, userId: bodyUserId } = body;

        let userId = bodyUserId;
        if (!userId) {
            const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
            if (!idToken) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const decodedToken = await getAuth().verifyIdToken(idToken);
            userId = decodedToken.uid;
        }

        if (!content && !title && (!imageUrls || imageUrls.length === 0)) {
            return NextResponse.json({ error: "Empty entry" }, { status: 400 });
        }

        // If ID exists, update. Else create new.
        const collectionRef = adminDb.collection("users").doc(userId).collection("journal_entries");

        if (id) {
            await collectionRef.doc(id).update({
                title,
                content,
                imageUrls: imageUrls || null,
                updatedAt: Timestamp.now()
            });
            return NextResponse.json({ success: true, id });
        } else {
            const docRef = await collectionRef.add({
                title,
                content,
                type,
                imageUrls: imageUrls || null,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
            return NextResponse.json({ success: true, id: docRef.id });
        }

    } catch (error: any) {
        console.error("Journal Save Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
