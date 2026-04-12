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
