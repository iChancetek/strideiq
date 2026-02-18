import { adminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        await adminDb.collection("users").doc(userId).collection("journal_entries").doc(id).delete();

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Journal Delete Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
