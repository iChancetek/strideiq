import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
    try {
        const { id, userId: bodyUserId } = await req.json();

        let userId = bodyUserId;
        if (!userId) {
            const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
            if (!idToken) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const decodedToken = await getAuth().verifyIdToken(idToken);
            userId = decodedToken.uid;
        }

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        const docRef = adminDb.collection("entries").doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: "Entry not found" }, { status: 404 });
        }

        const entry = docSnap.data()!;
        if (entry.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Soft-delete from top-level 'entries' collection
        await docRef.update({
            isDeleted: true,
            deletedAt: FieldValue.serverTimestamp()
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Journal Delete Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
