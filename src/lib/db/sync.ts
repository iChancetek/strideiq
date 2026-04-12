import { db } from "@/db";
import { users, userSettings, userStats } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function syncUserToPostgres(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }) {
    try {
        console.log(`[Sync] Syncing user ${user.uid} to Postgres...`);

        // 1. Upsert User Profile
        await db.insert(users).values({
            id: user.uid,
            email: user.email || "user@example.com",
            displayName: user.displayName,
            photoURL: user.photoURL,
        }).onConflictDoUpdate({
            target: users.id,
            set: {
                email: user.email || "user@example.com",
                displayName: user.displayName,
                photoURL: user.photoURL,
                updatedAt: new Date(),
            }
        });

        // 2. Initialize Settings if missing
        await db.insert(userSettings).values({
            userId: user.uid,
        }).onConflictDoNothing();

        // 3. Initialize Stats if missing
        await db.insert(userStats).values({
            userId: user.uid,
        }).onConflictDoNothing();

        console.log(`[Sync] Completed sync for ${user.uid}`);
    } catch (error) {
        console.error(`[Sync] Failed to sync user ${user.uid}:`, error);
        throw error;
    }
}
