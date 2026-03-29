"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { useState, useEffect } from "react";

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
                const response = await fetch(`/api/users/profile?userId=${user!.uid}`);
                if (!response.ok) {
                    setIsAdmin(false);
                } else {
                    const data = await response.json();
                    if (data.user && data.user.role === "admin") {
                        setIsAdmin(true);
                    } else {
                        setIsAdmin(false);
                    }
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
