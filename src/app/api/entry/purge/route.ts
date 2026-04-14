import { adminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const { entryId } = await req.json();
        if (!entryId) return NextResponse.json({ error: "Missing Entry ID" }, { status: 400 });

        const entryRef = adminDb.collection("entries").doc(entryId);
        const docSnap = await entryRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: "Entry not found" }, { status: 404 });
        }

        const data = docSnap.data()!;
        if (data.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (data.isDeleted !== true) {
            return NextResponse.json({ error: "Only deleted items can be purged" }, { status: 400 });
        }

        // Permanent delete
        await entryRef.delete();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Purge Entry Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
