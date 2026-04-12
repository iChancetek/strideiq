import { db } from "@/db";
import { journals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/auth-utils";

export async function GET() {
    try {
        const auth = await verifyFirebaseToken();
        if (auth.error || !auth.userId) {
            return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
        }
        
        console.log(`[Journal List API] Fetching entries for user: ${auth.userId}`);

        const entries = await db.query.journals.findMany({
            where: eq(journals.userId, auth.userId),
            orderBy: [desc(journals.date)],
        });

        return NextResponse.json(entries);
    } catch (error: any) {
        console.error("[Journal List API] CRITICAL Error:", error);
        return NextResponse.json({ error: "Internal Server Error: " + error.message }, { status: 500 });
    }
}
