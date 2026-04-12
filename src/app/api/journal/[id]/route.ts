import { getAuth } from "firebase-admin/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { journals } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const idToken = (await headers()).get("Authorization")?.split("Bearer ")[1];
        if (!idToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        const journalEntry = await db.query.journals.findFirst({
            where: and(eq(journals.id, id), eq(journals.userId, userId))
        });

        if (!journalEntry) {
            return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
        }

        const entry = {
            ...journalEntry,
            createdAt: journalEntry.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: journalEntry.updatedAt?.toISOString() || new Date().toISOString(),
        };

        return NextResponse.json({ entry });

    } catch (error: any) {
        console.error("Journal Get Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
