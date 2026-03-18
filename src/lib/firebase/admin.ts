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
                let parsed: any = null;
                try {
                    parsed = JSON.parse(key);
                } catch (firstErr) {
                    let cleanedKey = key.trim();
                    if (cleanedKey.includes('\\"')) {
                        cleanedKey = cleanedKey.replace(/\\"/g, '"');
                    }
                    // Replace literal real newlines with \\n for JSON parser (Next.js env can unescape \\n to real \n)
                    cleanedKey = cleanedKey.replace(/\n/g, '\\n');
                    
                    if (!cleanedKey.startsWith('{')) {
                        const braceIdx = cleanedKey.indexOf('{');
                        cleanedKey = braceIdx > -1 ? cleanedKey.substring(braceIdx) : '{' + cleanedKey;
                    }
                    if (!cleanedKey.endsWith('}')) {
                        const braceIdx = cleanedKey.lastIndexOf('}');
                        cleanedKey = braceIdx > -1 ? cleanedKey.substring(0, braceIdx + 1) : cleanedKey + '}';
                    }
                    
                    try {
                        parsed = JSON.parse(cleanedKey);
                    } catch (secondErr) {
                        console.warn("[Firebase Admin] Falling back to Regex parsing due to malformed payload.");
                        const extract = (field: string) => {
                            const match = key.match(new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`));
                            return match ? match[1].replace(/\\\\n/g, '\\n') : undefined;
                        };
                        parsed = {
                            type: extract("type") || "service_account",
                            project_id: extract("project_id"),
                            private_key: extract("private_key"),
                            client_email: extract("client_email")
                        };
                    }
                }
                
                if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }
                
                serviceAccount = parsed as admin.ServiceAccount;

                // Ensure private key handles literal '\\n' sequences
                const rawAccount = serviceAccount as any;
                if (rawAccount.private_key) {
                    rawAccount.private_key = rawAccount.private_key.replace(/\\n/g, '\n');
                }
                if (rawAccount.privateKey) {
                    rawAccount.privateKey = rawAccount.privateKey.replace(/\\n/g, '\n');
                }
            } catch (parseErr) {
                console.error("[Firebase Admin] Key parse error on string starting with:", key.substring(0, 15));
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
