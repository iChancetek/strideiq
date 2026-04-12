import { adminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const snapshot = await adminDb.collection("users").doc(userId).collection("fasting_logs")
            .orderBy("endTime", "desc")
            .limit(20)
            .get();

        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Ensure dates are strings
            startTime: typeof doc.data().startTime === 'number' ? new Date(doc.data().startTime).toISOString() : doc.data().startTime,
            endTime: typeof doc.data().endTime === 'number' ? new Date(doc.data().endTime).toISOString() : doc.data().endTime,
        }));

        return NextResponse.json({ logs });

    } catch (error: any) {
        console.error("Fasting List Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
