"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import UsersTable from "@/components/admin/UsersTable";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ADMIN_EMAIL = "Chancellor@ichancetek.com";

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user || user.email !== ADMIN_EMAIL) {
                router.push("/dashboard");
            } else {
                setAuthorized(true);
            }
        }
    }, [user, loading, router]);

    if (loading || !authorized) return null; // Or a loading spinner

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                <header style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 style={{ fontSize: "36px", marginBottom: "10px" }}>Admin Dashboard</h1>
                        <p style={{ color: "var(--foreground-muted)", fontSize: "18px" }}>Platform Overview & User Management</p>
                    </div>
                </header>

                {/* Stats Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                    <div className="glass-panel" style={{ padding: "24px", borderRadius: "16px" }}>
                        <div style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "8px" }}>Total Users</div>
                        <div style={{ fontSize: "32px", fontWeight: 700 }}>--</div>
                        {/* Placeholder for now, could lift state from table or separate query */}
                    </div>
                    <div className="glass-panel" style={{ padding: "24px", borderRadius: "16px" }}>
                        <div style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "8px" }}>System Status</div>
                        <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--primary)" }}>Online</div>
                    </div>
                </div>

                <h2 style={{ marginBottom: "20px" }}>Users</h2>
                <UsersTable />
            </div>
        </DashboardLayout>
    );
}
