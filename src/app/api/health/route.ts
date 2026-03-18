import { NextResponse } from "next/server";
import { adminDb, adminInitialized } from "@/lib/firebase/admin";

export async function GET() {
    const status: Record<string, any> = {
        timestamp: new Date().toISOString(),
        adminInitialized,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "NOT SET",
        hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        hasOpenAiKey: !!process.env.OPENAI_API_KEY,
        hasTavilyKey: !!process.env.TAVILY_API_KEY,
        firestorePing: "pending",
    };

    // Attempt a real Firestore read to verify connectivity
    try {
        await adminDb.collection("_health").limit(1).get();
        status.firestorePing = "ok";
    } catch (err: any) {
        status.firestorePing = `FAILED: ${err.message}`;
        status.firestoreErrorCode = err.code;
    }

    const allOk = status.adminInitialized && status.firestorePing === "ok";
    return NextResponse.json(status, { status: allOk ? 200 : 503 });
}
