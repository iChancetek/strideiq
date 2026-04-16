import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

dotenv.config();

async function diagnose() {
    try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;

        console.log("Project ID:", projectId);
        
        if (!admin.apps.length) {
            let config: any = { projectId };
            if (key) {
                const parsedKey = JSON.parse(key);
                config.credential = admin.credential.cert(parsedKey);
                console.log("Using Service Account Cert for project:", parsedKey.project_id);
            } else {
                config.credential = admin.credential.applicationDefault();
                console.log("Using Application Default Credentials");
            }
            admin.initializeApp(config);
        }

        // Try to access the default database
        const db = getFirestore();
        console.log("Database ID from options:", (db as any)._settings?.databaseId || "default");
        
        try {
            const collections = await db.listCollections();
            console.log("Collections in default DB:", collections.map(c => c.id));
        } catch (e: any) {
            console.error("Default DB access failed:", e.message);
        }

    } catch (err: any) {
        console.error("DIAGNOSTIC_FAILURE:", err.message);
    }
}

diagnose();
