import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
    try {
        const { userId, requestId } = await req.json(); // userId is the RECEIVER accepting the request

        if (!userId || !requestId) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        const requestRef = adminDb.collection("friends").doc(requestId);
        const requestDoc = await requestRef.get();

        if (!requestDoc.exists) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        const data = requestDoc.data();
        if (data?.receiverId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (data?.status !== "pending") {
            return NextResponse.json({ error: "Request already handled" }, { status: 400 });
        }

        // Accept
        await requestRef.update({
            status: "accepted",
            updatedAt: FieldValue.serverTimestamp()
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Friend Accept Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
