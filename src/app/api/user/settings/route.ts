import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const doc = await adminDb.collection("users").doc(userId).get();
        return NextResponse.json(doc.data()?.settings || { theme: "dark" });
    } catch (e) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}