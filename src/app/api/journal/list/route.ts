import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { journals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifyFirebaseToken } from "@/lib/auth-utils";

export async function GET(req: Request) {
    try {
        const auth = await verifyFirebaseToken();
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const userId = auth.userId;

        // Query Postgres journals
        const userJournals = await db.query.journals.findMany({
            where: eq(journals.userId, userId),
            orderBy: [desc(journals.date)],
            limit: 50
        });

        const entries = userJournals.map(journal => ({
            ...journal,
            createdAt: journal.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: journal.updatedAt?.toISOString() || new Date().toISOString(),
        }));

        return NextResponse.json({ entries });

    } catch (error: any) {
        console.error("Journal List Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
