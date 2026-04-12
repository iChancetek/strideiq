import { adminAuth } from "@/lib/firebase/admin";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function verifyFirebaseToken() {
    try {
        const authHeader = (await headers()).get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return { error: "Missing or invalid Authorization header", status: 401 };
        }

        const idToken = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        
        return { userId: decodedToken.uid, decodedToken };
    } catch (error: any) {
        console.error("[Auth Utils] Token verification failed:", error.message);
        return { error: "Unauthorized", status: 401 };
    }
}
export const ADMIN_EMAILS = ["chancellor@ichancetek.com", "chanceminus@gmail.com"];

export async function verifyAdmin() {
    const auth = await verifyFirebaseToken();
    if ("error" in auth) return auth;

    if (!auth.decodedToken.email || !ADMIN_EMAILS.includes(auth.decodedToken.email.toLowerCase())) {
        console.warn(`[Admin Auth] Access denied for user: ${auth.decodedToken.email}`);
        return { error: "Forbidden: Admin access required", status: 403 };
    }

    return auth;
}
