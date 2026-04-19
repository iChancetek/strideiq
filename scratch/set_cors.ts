import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

async function run() {
    console.log("Loading firebase...");
    const { getStorage } = await import("firebase-admin/storage");
    await import("../src/lib/firebase/admin");

    try {
        console.log("Getting bucket...");
        const bucket = getStorage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
        
        await bucket.setCorsConfiguration([
            {
              "origin": ["*"],
              "method": ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
              "maxAgeSeconds": 3600,
              "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"]
            }
        ]);
        console.log("CORS configured successfully.");
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
    process.exit(0);
}
run();
