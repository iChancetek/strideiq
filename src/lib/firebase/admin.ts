import * as admin from "firebase-admin";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminInitialized = false;

if (!admin.apps.length) {
    try {
        const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        console.log(`[Firebase Admin] Initializing for project: ${projectId}`);

        if (!projectId) {
            console.warn("[Firebase Admin] NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set. Initialization skipped (expected during build).");
        } else {
            if (key) {
                console.log("[Firebase Admin] Using Service Account Key from environment");
                // Priority 1: Explicit service account key from Secret Manager
                let serviceAccount: admin.ServiceAccount;
                try {
                    let parsedKey;
                    const trimmedKey = key.trim();
                    
                    if (trimmedKey.startsWith("{")) {
                        parsedKey = JSON.parse(trimmedKey);
                    } else if (trimmedKey.startsWith('"')) {
                        // Handle double escaped JSON which sometimes happens in secret managers
                        parsedKey = JSON.parse(JSON.parse(trimmedKey));
                    } else {
                        console.error("[Firebase Admin] Key starts with unexpected character:", trimmedKey[0]);
                        throw new Error("Key not in recognized JSON format");
                    }
                    
                    serviceAccount = {
                        projectId: parsedKey.project_id || projectId,
                        privateKey: parsedKey.private_key?.replace(/\\n/g, '\n'),
                        clientEmail: parsedKey.client_email
                    } as admin.ServiceAccount;
    
                    if (!serviceAccount.privateKey || !serviceAccount.clientEmail) {
                        throw new Error("Service account key is missing private_key or client_email");
                    }
    
                } catch (parseErr: any) {
                    console.error("[Firebase Admin] Key extraction failed:", parseErr.message);
                    throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${parseErr.message}`);
                }
    
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId,
                    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                });
                console.log("[Firebase Admin] Initialized with Service Account Cert");
            } else {
                console.log("[Firebase Admin] No service account key found, using Application Default Credentials");
                // Priority 2: Application Default Credentials (Cloud Run / App Hosting)
                admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                    projectId,
                    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                });
                console.log("[Firebase Admin] Initialized with Application Default Credentials");
            }
            adminInitialized = true;
        }
    } catch (error: any) {
        console.error("[Firebase Admin] CRITICAL: Initialization failed:", error.message);
    }
} else {
    adminInitialized = true;
}

// Cache the Firestore instance — target the named "default" database where production data lives.
let _firestoreInstance: Firestore | null = null;
const getDb = (): Firestore => {
    if (!admin.apps.length) throw new Error("Firebase Admin not initialized.");
    if (!_firestoreInstance) {
        _firestoreInstance = getFirestore(admin.app(), "default");
        try {
            _firestoreInstance.settings({ preferRest: true, ignoreUndefinedProperties: true });
        } catch {
            // settings() can only be called once; ignore if already set.
        }
    }
    return _firestoreInstance;
};

// Failsafe getters to prevent server crashes during module evaluation
export const getAdminDb = () => getDb();

export const getAdminAuth = () => {
    if (!admin.apps.length) throw new Error("Firebase Admin not initialized. Check server logs.");
    return admin.auth();
};

// Safe lazy proxy for adminDb — all routes using `adminDb.collection(...)` will work correctly
// because the proxy forwards property access to a live Firestore instance.
export const adminDb = new Proxy({} as Firestore, {
    get(_target, prop) {
        const db = getDb();
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
