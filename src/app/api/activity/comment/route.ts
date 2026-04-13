import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { headers } from "next/headers";
import { getAuth } from "firebase-admin/auth";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const activityId = searchParams.get("activityId");

        if (!activityId) {
            return NextResponse.json({ error: "Activity ID required" }, { status: 400 });
        }

        const snapshot = await adminDb.collection("entries").doc(activityId).collection("comments").orderBy("createdAt", "asc").get();
        const comments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ comments });
    } catch (error: any) {
        console.error("Fetch Comments Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const decodedToken = await getAuth().verifyIdToken(idToken);
        const myUserId = decodedToken.uid;

        const { activityId, text, parentId = null } = await req.json();

        if (!activityId || !text) {
            return NextResponse.json({ error: "Activity ID and text required" }, { status: 400 });
        }

        // Get user info
        const userDoc = await adminDb.collection("users").doc(myUserId).get();
        const userData = userDoc.data() || {};

        const docRef = await adminDb.collection("entries").doc(activityId).collection("comments").add({
            userId: myUserId,
            userName: userData.displayName || userData.name || "Runner",
            userPhoto: userData.photoURL || null,
            text,
            parentId,
            createdAt: FieldValue.serverTimestamp(),
        });

        // Create Notification
        try {
            const activityDoc = await adminDb.collection("entries").doc(activityId).get();
            const activityData = activityDoc.data();
            
            if (activityData && activityData.userId !== myUserId) {
                await adminDb.collection("notifications").add({
                    userId: activityData.userId, // Recipient
                    actorId: myUserId,
                    actorName: userData.displayName || userData.name || "Runner",
                    actorPhoto: userData.photoURL || null,
                    type: "comment",
                    activityId: activityId,
                    activityTitle: activityData.title || activityData.type,
                    read: false,
                    createdAt: FieldValue.serverTimestamp(),
                    content: text.length > 50 ? text.substring(0, 47) + "..." : text
                });
            }
        } catch (notifyErr) {
            console.error("Failed to create notification:", notifyErr);
        }

        return NextResponse.json({ success: true, commentId: docRef.id });

    } catch (error: any) {
        console.error("Post Comment Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const decodedToken = await getAuth().verifyIdToken(idToken);
        const myUserId = decodedToken.uid;

        const { searchParams } = new URL(req.url);
        const commentId = searchParams.get("id");
        const activityId = searchParams.get("activityId");

        if (!commentId || !activityId) return NextResponse.json({ error: "IDs missing" }, { status: 400 });

        const commentRef = adminDb.collection("entries").doc(activityId).collection("comments").doc(commentId);
        const doc = await commentRef.get();

        if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Check ownership (simple check for now)
        if (doc.data()?.userId !== myUserId) {
            // Check if user is admin (optional hardening but I'll skip for MVP)
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await commentRef.delete();
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Delete Comment Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}