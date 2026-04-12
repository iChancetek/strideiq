import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

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
                    let parsedKey;
                    if (key.startsWith("{")) {
                        parsedKey = JSON.parse(key);
                    } else if (key.startsWith('"')) {
                        parsedKey = JSON.parse(JSON.parse(key)); // handle double escaped json
                    } else {
                        throw new Error("Key not in recognized JSON format");
                    }
                    
                    serviceAccount = {
                        projectId: parsedKey.project_id || projectId,
                        privateKey: parsedKey.private_key.replace(/\\n/g, '\n'),
                        clientEmail: parsedKey.client_email
                    } as admin.ServiceAccount;

                } catch (parseErr: any) {
                    console.error("[Firebase Admin] Key extraction failed:", parseErr.message);
                    throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${parseErr}`);
                }

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId,
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            });
        } else {
            console.log("[Firebase Admin] No service account key found, using Application Default Credentials");
            // Priority 2: Application Default Credentials (Cloud Run / App Hosting)
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId,
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            });
        }

        adminInitialized = true;
    } catch (error) {
        console.error("[Firebase Admin] CRITICAL: Initialization failed:", error);
    }
} else {
    adminInitialized = true;
}

// Failsafe getters to prevent server crashes during module evaluation
export const getAdminDb = () => {
    if (!admin.apps.length) throw new Error("Firebase Admin not initialized. Check server logs.");
    return getFirestore(admin.app(), "default");
};

export const getAdminAuth = () => {
    if (!admin.apps.length) throw new Error("Firebase Admin not initialized. Check server logs.");
    return admin.auth();
};

// Legacy exports for compatibility (careful: these will still throw if accessed before init)
export const adminDb = admin.apps.length ? getFirestore(admin.app(), "default") : null as any;
export const adminAuth = admin.apps.length ? admin.auth() : null as any;

export { adminInitialized };
