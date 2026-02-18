"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase/config";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";

export function useUserRole() {
    const [user, loading, error] = useAuthState(auth);
    const [isAdmin, setIsAdmin] = useState(false);
    const [roleLoading, setRoleLoading] = useState(true);

    useEffect(() => {
        if (loading) return;
        if (!user) {
            setIsAdmin(false);
            setRoleLoading(false);
            return;
        }

        async function checkRole() {
            try {
                const ref = doc(db, "users", user!.uid);
                const snap = await getDoc(ref);
                if (snap.exists() && snap.data().role === "admin") {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
            } catch (e) {
                console.error("Failed to check role", e);
                setIsAdmin(false);
            } finally {
                setRoleLoading(false);
            }
        }
        checkRole();
    }, [user, loading]);

    return { user, isAdmin, loading: loading || roleLoading, error };
}
