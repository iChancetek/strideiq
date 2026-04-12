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

// Safe lazy proxy for adminDb — all routes using `adminDb.collection(...)` will work correctly
// because the proxy forwards property access to a live getFirestore() call at runtime.
export const adminDb = new Proxy({} as ReturnType<typeof getFirestore>, {
    get(_target, prop) {
        const db = getFirestore(admin.app(), "default");
        const val = (db as any)[prop];
        return typeof val === "function" ? val.bind(db) : val;
    }
});

// Safe lazy proxy for adminAuth
export const adminAuth = new Proxy({} as ReturnType<typeof admin.auth>, {
    get(_target, prop) {
        const auth = admin.auth();
        const val = (auth as any)[prop];
        return typeof val === "function" ? val.bind(auth) : val;
    }
});

export { adminInitialized };
