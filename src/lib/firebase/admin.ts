import * as admin from "firebase-admin";

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(), // Uses GOOGLE_APPLICATION_CREDENTIALS or GAE/Cloud Run identity
            // Fallback for local dev:
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
    } catch (error) {
        console.error("Firebase Admin Initialization Error:", error);
    }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
