import * as admin from "firebase-admin";

let adminInitialized = false;

if (!admin.apps.length) {
    try {
        const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        if (!projectId) {
            throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set");
        }

        if (key) {
            // Priority 1: Explicit service account key from Secret Manager
            let serviceAccount: admin.ServiceAccount;
            try {
                serviceAccount = JSON.parse(key);
            } catch (parseErr) {
                throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON: ${parseErr}`);
            }

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId,
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`,
            });
        } else {
            // Priority 2: Application Default Credentials (Cloud Run / App Hosting)
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId,
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`,
            });
        }

        adminInitialized = true;
        console.log(`[Firebase Admin] Initialized successfully for project: ${projectId}`);
    } catch (error) {
        console.error("[Firebase Admin] CRITICAL: Initialization failed:", error);
    }
} else {
    adminInitialized = true;
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export { adminInitialized };
