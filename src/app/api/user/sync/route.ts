import { adminDb } from "@/lib/firebase/admin";
import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/auth-utils";

export async function POST(req: Request) {
    try {
        const auth = await verifyFirebaseToken();
        if (auth.error || !auth.userId) {
            return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
        }

        const body = await req.json();
        const { email, displayName, photoURL } = body;

        await adminDb.collection("users").doc(auth.userId).set({
            uid: auth.userId,
            email: email || null,
            displayName: displayName || null,
            photoURL: photoURL || null,
            lastSynced: new Date()
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[User Sync API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
