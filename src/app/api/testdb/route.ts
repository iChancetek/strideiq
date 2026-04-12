export const dynamic = 'force-dynamic';
import { db } from "@/db";
import { users } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
    try {
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
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DB Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
