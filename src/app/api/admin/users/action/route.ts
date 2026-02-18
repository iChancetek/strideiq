import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, targetUserId, requesterId, newPassword, role } = body;

        if (!targetUserId || !action) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Verify Requester is Admin
        if (requesterId) {
            const requesterDoc = await adminDb.collection("users").doc(requesterId).get();
            if (!requesterDoc.exists || requesterDoc.data()?.role !== "admin") {
                return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
            }
        } else {
            // For strict security, always require requesterId or identify via token
            return NextResponse.json({ error: "Unauthorized - No requester ID" }, { status: 403 });
        }

        switch (action) {
            case "toggleStatus":
                const userRec = await adminAuth.getUser(targetUserId);
                const newStatus = !userRec.disabled;
                await adminAuth.updateUser(targetUserId, { disabled: newStatus });
                // Also update firestore for UI consistency if we tracked it there, but auth is source of truth for login.
                await adminDb.collection("users").doc(targetUserId).set({ disabled: newStatus }, { merge: true });
                return NextResponse.json({ success: true, disabled: newStatus });

            case "deleteUser":
                await adminAuth.deleteUser(targetUserId);
                await adminDb.collection("users").doc(targetUserId).delete();
                // Ideally delete their activities too, or keep for stats (anonymized)
                return NextResponse.json({ success: true });

            case "resetPassword":
                if (!newPassword || newPassword.length < 6) return NextResponse.json({ error: "Invalid password" }, { status: 400 });
                await adminAuth.updateUser(targetUserId, { password: newPassword });
                return NextResponse.json({ success: true });

            case "changeRole":
                if (!role) return NextResponse.json({ error: "Missing role" }, { status: 400 });
                await adminDb.collection("users").doc(targetUserId).set({ role }, { merge: true });
                // Custom claims for role-based security rules
                await adminAuth.setCustomUserClaims(targetUserId, { role });
                return NextResponse.json({ success: true });

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Admin Action Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
