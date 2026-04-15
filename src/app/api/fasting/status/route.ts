import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;
        
        const snapshot = await getAdminDb().collection("users").doc(userId)
            .collection("fasting_sessions").where("status", "==", "active").limit(1).get();
            
        return NextResponse.json({ activeSession: snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } });
    } catch (e: any) {
        return NextResponse.json({ error: "Status GET Error: " + (e.message || String(e)) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const body = await req.json();
        const { action, goalHours, notes, media } = body;
        
        if (!action) return NextResponse.json({ error: "Missing action" }, { status: 400 });
        
        await getAdminDb().collection("users").doc(userId).set({ uid: userId }, { merge: true });
        const sessionsRef = getAdminDb().collection("users").doc(userId).collection("fasting_sessions");
        
        if (action === "start") {
            console.log("[FASTING_STATUS] Starting new session for user:", userId);
            await sessionsRef.add({
                userId,
                startTime: new Date().toISOString(),
                goal: goalHours || 16,
                status: "active"
            });
            console.log("[FASTING_STATUS] Session started successfully.");
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
                
                // Add to history (standardized entries collection)
                await getAdminDb().collection("entries").add({
                    userId,
                    type: "Fasting",
                    startTime: doc.data().startTime,
                    endTime: new Date().toISOString(),
                    duration: durationSeconds, // standardizing to seconds
                    date: new Date(), // standardized timestamp for timeline
                    goal: doc.data().goal || 16,
                    notes: notes || "Fasting Session",
                    media: media || null,
                    createdAt: new Date().toISOString()
                });
            }
        }
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: "Status POST Error: " + (e.message || String(e)) }, { status: 500 });
    }
}