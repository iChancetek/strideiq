import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { headers } from "next/headers";
import { getAuth } from "firebase-admin/auth";

export async function POST(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const decodedToken = await getAuth().verifyIdToken(idToken);
        const myUserId = decodedToken.uid;

        const { activityId, emoji = "👍" } = await req.json();

        if (!activityId) {
            return NextResponse.json({ error: "Activity ID required" }, { status: 400 });
        }

        const likeRef = adminDb.collection("entries").doc(activityId).collection("likes").doc(myUserId);
        const doc = await likeRef.get();

        if (doc.exists) {
            // Toggle off if same emoji, or update if different
            const currentEmoji = doc.data()?.emoji;
            if (currentEmoji === emoji) {
                await likeRef.delete();
                // Decrement count on parent activity for fast display
                await adminDb.collection("entries").doc(activityId).update({
                    likesCount: FieldValue.increment(-1)
                }).catch(() => {}); // Parent might not have the field yet
                
                return NextResponse.json({ success: true, action: "unliked" });
            } else {
                await likeRef.update({ emoji, updatedAt: FieldValue.serverTimestamp() });
                return NextResponse.json({ success: true, action: "updated" });
            }
        } else {
            // New Like
            // Get user info for fast display in feed
            const userDoc = await adminDb.collection("users").doc(myUserId).get();
            const userData = userDoc.data() || {};

            await likeRef.set({
                userId: myUserId,
                userName: userData.displayName || userData.name || "Runner",
                userPhoto: userData.photoURL || null,
                emoji: emoji,
                createdAt: FieldValue.serverTimestamp(),
            });

            // Increment count on parent
            await adminDb.collection("entries").doc(activityId).update({
                likesCount: FieldValue.increment(1)
            }).catch(() => {
                // If update fails because document doesn't have the field, set it
                return adminDb.collection("entries").doc(activityId).set({ likesCount: 1 }, { merge: true });
            });

            return NextResponse.json({ success: true, action: "liked" });
        }

    } catch (error: any) {
        console.error("Like API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}