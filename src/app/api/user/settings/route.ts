import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/auth-utils";

export async function GET() {
    try {
        const auth = await verifyFirebaseToken();
        if (auth.error || !auth.userId) {
            return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
        }
        
        const settings = await db.query.userSettings.findFirst({
            where: eq(userSettings.userId, auth.userId)
        });

        return NextResponse.json(settings || {});
    } catch (error: any) {
        console.error("[Settings API] GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const auth = await verifyFirebaseToken();
        if (auth.error || !auth.userId) {
            return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
        }

        const body = await req.json();
        const { userId, updatedAt, ...updatable } = body; // Filter out protected fields

        await db.insert(userSettings).values({
            userId: auth.userId,
            ...updatable,
            updatedAt: new Date(),
        }).onConflictDoUpdate({
            target: userSettings.userId,
            set: {
                ...updatable,
                updatedAt: new Date(),
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[Settings API] POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
