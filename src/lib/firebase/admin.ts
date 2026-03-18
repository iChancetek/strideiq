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
                    // Method 1: Standard JSON parse
                    parsed = JSON.parse(key);
                } catch (firstErr) {
                    let cleanedKey = key.trim();
                    
                    // Method 2: Handle stringified-string (double-quoted JSON)
                    if (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) {
                        try {
                            const unquoted = JSON.parse(cleanedKey);
                            if (typeof unquoted === 'string') cleanedKey = unquoted;
                        } catch (e) {}
                    }

                    // Method 3: Clean literal backslash-escaped quotes and try again
                    const normalized = cleanedKey.replace(/\\"/g, '"').replace(/\n/g, '\\n');
                    try {
                        parsed = JSON.parse(normalized);
                    } catch (secondErr) {
                        console.warn("[Firebase Admin] Native JSON parse failed, using fallback extraction from normalized string.");
                        // Method 4: Liberal Regex extraction on the normalized string
                        const extract = (field: string) => {
                            // Since normalized has standard quotes, we can use a simpler regex
                            const regex = new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`);
                            const match = normalized.match(regex);
                            if (match) {
                                // In normalized, escaped newlines are still \\n
                                return match[1].replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');
                            }
                            return undefined;
                        };
                        
                        // For private_key, we want to match everything until the closing quote
                        const pkMatch = normalized.match(/"private_key"\s*:\s*"([^"]+)"/);
                        const privateKey = pkMatch ? pkMatch[1].replace(/\\\\n/g, '\n').replace(/\\n/g, '\n') : undefined;

                        parsed = {
                            type: extract("type") || "service_account",
                            project_id: extract("project_id") || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                            private_key: privateKey,
                            client_email: extract("client_email")
                        };
                    }
                }
                
                if (typeof parsed === 'string') {
                    try {
                        parsed = JSON.parse(parsed);
                    } catch (e) {}
                }
                
                serviceAccount = parsed as admin.ServiceAccount;
                const rawAccount = serviceAccount as any;

                // Final normalization: ensure project_id exists (Firebase Admin requirement)
                if (!rawAccount.project_id && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
                    rawAccount.project_id = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
                }

                // Ensure private key handles literal '\\n' sequences
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
