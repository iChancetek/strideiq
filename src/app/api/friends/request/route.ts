import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
    try {
        const { userId, targetUserId } = await req.json(); // In prod, get userId from session

        if (!userId || !targetUserId) {
            return NextResponse.json({ error: "Missing user IDs" }, { status: 400 });
        }

        if (userId === targetUserId) {
            return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
        }

        // Check availability
        const targetUserDoc = await adminDb.collection("users").doc(targetUserId).get();
        if (!targetUserDoc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if request already exists
        const existingQuery = await adminDb.collection("friends")
            .where("requesterId", "in", [userId, targetUserId])
            .where("receiverId", "in", [userId, targetUserId])
            .get();

        if (!existingQuery.empty) {
            // In a robust system, we might handle "declined" state specifically to allow re-requesting
            return NextResponse.json({ error: "Friendship status already exists" }, { status: 409 });
        }

        // Create Request
        await adminDb.collection("friends").add({
            requesterId: userId,
            receiverId: targetUserId,
            status: "pending",
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Friend Request Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
