"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [user, loading] = useAuthState(auth);
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingRole, setCheckingRole] = useState(true);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else {
                checkAdminRole(user.uid);
            }
        }
    }, [user, loading, router]);

    const checkAdminRole = async (uid: string) => {
        try {
            const ref = doc(db, "users", uid);
            const snap = await getDoc(ref);
            if (snap.exists() && snap.data().role === "admin") {
                setIsAdmin(true);
            } else {
                router.push("/dashboard"); // Kick non-admins out
            }
        } catch (e) {
            console.error(e);
            router.push("/dashboard");
        } finally {
            setCheckingRole(false);
        }
    };

    if (loading || checkingRole) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", color: "#fff" }}>
                Verifying Admin Privileges...
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#000" }}>
            {/* Admin Sidebar */}
            <aside style={{ width: "240px", borderRight: "1px solid rgba(255,255,255,0.1)", padding: "20px", display: "flex", flexDirection: "column" }}>
                <div style={{ marginBottom: "40px", paddingLeft: "10px" }}>
                    <h1 style={{ fontSize: "20px", fontWeight: "bold" }}>Valid<span className="text-gradient">Admin</span></h1>
                </div>
                <nav style={{ flex: 1 }}>
                    <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                        <li>
                            <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "8px", color: "var(--foreground)", textDecoration: "none", background: "rgba(255,255,255,0.05)" }}>
                                📊 Overview
                            </Link>
                        </li>
                        <li>
                            <Link href="/admin/users" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "8px", color: "var(--foreground)", textDecoration: "none" }}>
                                👥 Users
                            </Link>
                        </li>
                    </ul>
                </nav>
                <div>
                    <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", color: "var(--foreground-muted)", textDecoration: "none", fontSize: "14px" }}>
                        ← Back to App
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
                {children}
            </main>
        </div>
    );
}
