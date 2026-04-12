import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyFirebaseToken } from "@/lib/auth-utils";

export async function GET(req: Request) {
    try {
        const auth = await verifyFirebaseToken();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const doc = await adminDb.collection("users").doc(auth.userId).get();
        return NextResponse.json(doc.data() || {});
    } catch (e: any) {
        console.error("[PROFILE_ERROR]:", e);
        return NextResponse.json({ error: e.message || "Internal Error" }, { status: 500 });
    }
}