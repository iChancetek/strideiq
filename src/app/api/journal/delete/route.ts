import { db } from "@/db";
import { journals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/auth-utils";

export async function POST(req: Request) {
    try {
        const auth = await verifyFirebaseToken();
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const userId = auth.userId;

        const { id } = await req.json();

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
