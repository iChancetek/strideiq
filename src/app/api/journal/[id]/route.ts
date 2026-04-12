import { adminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;
        const { id } = await params;

        // Fetch from top-level 'entries' collection
        const docSnapshot = await adminDb.collection("entries").doc(id).get();

        if (!docSnapshot.exists) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const data = docSnapshot.data();

        // Security: ensure this entry belongs to the requesting user
        if (data?.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json({
            id: docSnapshot.id,
            ...data,
            createdAt: data?.createdAt?.toDate?.()?.toISOString(),
            updatedAt: data?.updatedAt?.toDate?.()?.toISOString()
        });

    } catch (error: any) {
        console.error("Journal Get Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
