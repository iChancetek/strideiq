import { getAdminDb } from "@/lib/firebase/admin";
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

        const snapshot = await getAdminDb().collection("entries")
            .where("userId", "==", userId)
            .where("type", "==", "Fasting")
            .orderBy("date", "desc")
            .limit(50)
            .get();

        const logs = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Ensure date string for frontend
                endTime: data.endTime || (data.date?.toDate ? data.date.toDate().toISOString() : data.date),
                startTime: data.startTime || "",
                durationMinutes: data.duration || 0, // frontend expects durationMinutes
            };
        });

        return NextResponse.json({ logs });

    } catch (error: any) {
        console.error("Fasting List Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
