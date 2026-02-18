import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
        }

        // Fetch pending requests received by this user
        const requestsSnap = await adminDb.collection("friends")
            .where("receiverId", "==", userId)
            .where("status", "==", "pending")
            .get();

        if (requestsSnap.empty) {
            return NextResponse.json({ requests: [] });
        }

        const requestDocs = requestsSnap.docs.map(doc => ({
            requestId: doc.id,
            ...doc.data()
        }));

        // Fetch profiles of requesters
        const requesterIds = requestDocs.map(r => r.requesterId);
        // split into chunks of 10 if needed, for now assume < 10 pending

        if (requesterIds.length === 0) return NextResponse.json({ requests: [] });

        const userRefs = requesterIds.map(id => adminDb.collection("users").doc(id));
        const userDocs = await adminDb.getAll(...userRefs);

        const requests = requestDocs.map(req => {
            const userDoc = userDocs.find(u => u.id === req.requesterId);
            return {
                id: req.requestId,
                requester: {
                    uid: userDoc?.id,
                    displayName: userDoc?.data()?.displayName || "Unknown",
                    photoURL: userDoc?.data()?.photoURL
                },
                createdAt: req.createdAt?.toDate()
            };
        });

        return NextResponse.json({ requests });

    } catch (error: any) {
        console.error("Pending Requests Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
