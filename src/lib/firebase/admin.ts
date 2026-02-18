import * as admin from "firebase-admin";

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(), // Uses GOOGLE_APPLICATION_CREDENTIALS or GAE/Cloud Run identity
            // For local dev without creds, this might fail unless authenticated via gcloud CLI
            // Fallback for local dev:
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
    } catch (error) {
        console.error("Firebase Admin Initialization Error:", error);
    }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
