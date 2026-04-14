import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const { entryId } = await req.json();
        if (!entryId) return NextResponse.json({ error: "Missing Entry ID" }, { status: 400 });

        const entryRef = adminDb.collection("entries").doc(entryId);
        const docSnap = await entryRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: "Entry not found" }, { status: 404 });
        }

        const data = docSnap.data()!;
        if (data.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 1. Restore the entry
        await entryRef.update({
            isDeleted: false,
            deletedAt: FieldValue.delete(),
            restoredAt: FieldValue.serverTimestamp()
        });

        // 2. Re-increment stats if it was an activity
        if (data.distance !== undefined || data.type !== "journal") {
            try {
                const dateObj = new Date(data.date?.toDate ? data.date.toDate() : data.date);
                const monthKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, "0")}`;

                const userDocRef = adminDb.collection("users").doc(userId);
                const allTimeRef = userDocRef.collection("stats").doc("allTime");
                const monthlyRef = userDocRef.collection("stats").doc(monthKey);

                await Promise.all([
                    allTimeRef.set({
                        totalMiles: FieldValue.increment(data.distance || 0),
                        totalRuns: FieldValue.increment(1),
                        totalTime: FieldValue.increment(data.duration || 0),
                        lastUpdated: FieldValue.serverTimestamp(),
                    }, { merge: true }),
                    monthlyRef.set({
                        totalMiles: FieldValue.increment(data.distance || 0),
                        totalRuns: FieldValue.increment(1),
                        totalTime: FieldValue.increment(data.duration || 0),
                        lastUpdated: FieldValue.serverTimestamp(),
                    }, { merge: true })
                ]);
            } catch (statsErr) {
                console.error("Stats increment failed (non-fatal):", statsErr);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Restore Entry Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
