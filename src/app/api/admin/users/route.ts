import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { verifyAdmin } from "@/lib/auth-utils";

export async function GET(req: Request) {
    try {
        const authCheck = await verifyAdmin();
        if ("error" in authCheck) {
            return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
        }

        // 1. Fetch Users from Firestore
        const usersSnap = await adminDb.collection("users").get();
        const firestoreUsers = usersSnap.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        }));

        // 2. Fetch Users from Firebase Auth (to get real auth status / metadata)
        // Note: listUsers is paginated (max 1000 per page)
        const listUsersResult = await adminAuth.listUsers(1000);
        const authUsersMap = new Map();
        listUsersResult.users.forEach((u) => {
            authUsersMap.set(u.uid, {
                disabled: u.disabled,
                creationTime: u.metadata.creationTime,
                lastSignInTime: u.metadata.lastSignInTime,
                emailVerified: u.emailVerified
            });
        });

        // 3. Merge data
        const mergedUsers = firestoreUsers.map(fu => {
            const authData = authUsersMap.get(fu.uid) || {};
            return {
                ...fu,
                ...authData
            };
        });

        // Sort by creation time descending
        mergedUsers.sort((a, b) => {
            const dateA = new Date(a.creationTime || a.createdAt || 0).getTime();
            const dateB = new Date(b.creationTime || b.createdAt || 0).getTime();
            return dateB - dateA;
        });

        return NextResponse.json({ users: mergedUsers });

    } catch (error: any) {
        console.error("[ADMIN_USERS_GET_ERROR]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
