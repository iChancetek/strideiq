import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        
        const snapshot = await adminDb.collection("users").doc(userId)
            .collection("fasting_sessions").where("status", "==", "active").limit(1).get();
            
        return NextResponse.json({ activeSession: snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } });
    } catch (e) {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, action, goalHours, notes, media } = body;
        
        if (!userId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        
        await adminDb.collection("users").doc(userId).set({ uid: userId }, { merge: true });
        const sessionsRef = adminDb.collection("users").doc(userId).collection("fasting_sessions");
        
        if (action === "start") {
            await sessionsRef.add({
                userId,
                startTime: new Date().toISOString(),
                goal: goalHours || 16,
                status: "active"
            });
        } else if (action === "stop") {
            const activeSnapshot = await sessionsRef.where("status", "==", "active").limit(1).get();
            if (!activeSnapshot.empty) {
                const doc = activeSnapshot.docs[0];
                const startTime = new Date(doc.data().startTime).getTime();
                const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
                
                await doc.ref.update({
                    endTime: new Date().toISOString(),
                    duration: durationSeconds,
                    notes: notes || null,
                    media: media || null,
                    status: "completed"
                });
                
                // Add to history
                await adminDb.collection("entries").add({
                    userId,
                    type: "Fasting",
                    duration: durationSeconds,
                    date: new Date(),
                    mode: "fasting",
                    notes: notes || "Fasting Session"
                });
            }
        }
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}