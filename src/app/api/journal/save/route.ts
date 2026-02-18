import { adminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const body = await req.json();
        const { id, title, content, type = "journal" } = body;

        if (!content && !title) {
            return NextResponse.json({ error: "Empty entry" }, { status: 400 });
        }

        // If ID exists, update. Else create new.
        const collectionRef = adminDb.collection("users").doc(userId).collection("journal_entries");

        if (id) {
            await collectionRef.doc(id).update({
                title,
                content,
                updatedAt: FieldValue.serverTimestamp()
            });
            return NextResponse.json({ success: true, id });
        } else {
            const docRef = await collectionRef.add({
                title,
                content,
                type,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });
            return NextResponse.json({ success: true, id: docRef.id });
        }

    } catch (error: any) {
        console.error("Journal Save Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
