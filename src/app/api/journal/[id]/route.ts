import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { journals } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;
        const { id } = await params;

        // Fetch from Postgres journals where ID and UserID match
        const [journal] = await db.select().from(journals).where(
            and(eq(journals.id, id), eq(journals.userId, userId))
        );

        if (!journal) {
            return NextResponse.json({ error: "Not found or Forbidden" }, { status: 404 });
        }

        return NextResponse.json({
            ...journal,
            createdAt: journal.createdAt?.toISOString(),
            updatedAt: journal.updatedAt?.toISOString()
        });

    } catch (error: any) {
        console.error("Journal Get Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
