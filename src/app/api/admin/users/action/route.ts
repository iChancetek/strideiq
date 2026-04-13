import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/auth-utils";

export async function POST(req: Request) {
    let action = "unknown";
    try {
        const authCheck = await verifyAdmin();
        if ("error" in authCheck) {
            return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
        }

        const body = await req.json();
        const { uid, data } = body;
        action = body.action || "unknown";

        if (!uid || !action) {
            return NextResponse.json({ error: "Missing uid or action" }, { status: 400 });
        }

        // Prevent admin from disabling/deleting themselves (safeguard)
        if (uid === authCheck.userId && (action === "disable" || action === "delete")) {
            return NextResponse.json({ error: "You cannot disable or delete your own account." }, { status: 400 });
        }

        switch (action) {
            case "disable":
                await adminAuth.updateUser(uid, { disabled: true });
                break;
            case "enable":
                await adminAuth.updateUser(uid, { disabled: false });
                break;
            case "delete":
                // Delete from Auth
                await adminAuth.deleteUser(uid);
                // Delete from Firestore Profile
                await adminDb.collection("users").doc(uid).delete();
                // Optionally delete entries, friends, etc. - in production we'd do a batch delete or use a trigger.
                break;
            case "update-password":
                if (!data?.password || data.password.length < 6) {
                    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
                }
                await adminAuth.updateUser(uid, { password: data.password });
                break;
            case "edit":
                if (!data?.profile) {
                    return NextResponse.json({ error: "Missing profile data" }, { status: 400 });
                }
                // Update Firestore profile
                await adminDb.collection("users").doc(uid).set({
                    ...data.profile,
                    updatedAt: new Date().toISOString()
                }, { merge: true });
                
                // Sync with Auth if displayName or email changed
                const authUpdates: any = {};
                if (data.profile.displayName) authUpdates.displayName = data.profile.displayName;
                if (data.profile.email) authUpdates.email = data.profile.email;

                if (Object.keys(authUpdates).length > 0) {
                    await adminAuth.updateUser(uid, authUpdates);
                }
                break;
            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        return NextResponse.json({ success: true, action });

    } catch (error: any) {
        console.error(`[ADMIN_USER_ACTION_ERROR] ${action}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
