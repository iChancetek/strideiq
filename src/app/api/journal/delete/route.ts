import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { journals } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(req: Request) {
    try {
        const { id, userId: bodyUserId } = await req.json();

        let userId = bodyUserId;
        if (!userId) {
            const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
            if (!idToken) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const decodedToken = await getAuth().verifyIdToken(idToken);
            userId = decodedToken.uid;
        }

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        // Delete from Postgres journals table where user matches
        await db.delete(journals).where(
            and(eq(journals.id, id), eq(journals.userId, userId))
        );

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Journal Delete Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
