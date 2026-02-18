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

        const docSnapshot = await adminDb.collection("users").doc(userId).collection("journal_entries").doc(id).get();

        if (!docSnapshot.exists) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const data = docSnapshot.data();

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
