import { db } from "./src/db";
import { users } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
    try {
        console.log("running");
        await db.insert(users).values({
            id: "7veZQx0WFNaTAjxQRYnTfqgfFKF2",
            email: "chancellor@ichancetek.com",
            displayName: "Elite Athlete",
            photoURL: "",
        }).onConflictDoUpdate({
            target: users.id,
            set: { 
                email: "chancellor@ichancetek.com",
                updatedAt: new Date()
            }
        });
        console.log("success");
    } catch (e) {
        console.log("error", e);
    }
}
run();
