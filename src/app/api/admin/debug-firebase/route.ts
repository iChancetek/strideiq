import { adminDb, adminInitialized } from "@/lib/firebase/admin";
import { NextResponse } from "next/server";
import * as admin from "firebase-admin";

export async function GET() {
    try {
        const apps = admin.apps.map(app => ({
            name: app?.name,
            options: {
                projectId: app?.options.projectId,
                storageBucket: app?.options.storageBucket,
                serviceAccountEmail: (app?.options.credential as any)?.clientEmail || "unknown"
            }
        }));

        let firestoreStatus = "Unknown";
        let collections: string[] = [];
        let firestoreError = null;

        if (adminInitialized && adminDb) {
            try {
                // Test Write
                const testRef = adminDb.collection("_debug").doc("connection_test");
                await testRef.set({ timestamp: admin.firestore.FieldValue.serverTimestamp(), note: "Debugging NOT_FOUND error" });
                
                const colls = await adminDb.listCollections();
                collections = colls.map(c => c.id);
                firestoreStatus = "Connected (Write Success)";
                
                // Cleanup
                await testRef.delete();
            } catch (err: any) {
                console.error("[DEBUG_FIREBASE] Firestore test failed:", err);
                firestoreStatus = `Error: ${err.code || "Unknown"}`;
                firestoreError = {
                    message: err.message,
                    code: err.code,
                    details: err.details,
                    stack: err.stack?.split("\n").slice(0, 5)
                };
            }
        } else {
            firestoreStatus = "Not Initialized";
        }

        return NextResponse.json({
            status: "ok",
            adminInitialized,
            appsCount: admin.apps.length,
            apps,
            firestore: {
                status: firestoreStatus,
                collections,
                error: firestoreError
            },
            env: {
                NODE_ENV: process.env.NODE_ENV,
                PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                HAS_KEY: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
                KEY_SIZE: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length || 0
            }
        });
    } catch (error: any) {
        return NextResponse.json({
            status: "error",
            message: error.message,
            stack: error.stack?.split("\n").slice(0, 3)
        }, { status: 500 });
    }
}
