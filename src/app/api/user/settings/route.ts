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
        return NextResponse.json(doc.data()?.settings || { theme: "dark" });
    } catch (e: any) {
        console.error("[SETTINGS_ERROR]:", e);
        return NextResponse.json({ error: e.message || "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const body = await req.json();
        
        // Save to user doc under 'settings' field
        await adminDb.collection("users").doc(userId).set({
            settings: body
        }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("[SETTINGS_SAVE_ERROR]:", e);
        return NextResponse.json({ error: e.message || "Internal Error" }, { status: 500 });
    }
}