import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const doc = await adminDb.collection("users").doc(userId).get();
        return NextResponse.json(doc.data()?.stats || {});
    } catch (e) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}