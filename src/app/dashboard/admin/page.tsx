"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { authenticatedFetch } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const COLORS = ["#ccff00", "#00e5ff", "#ff0055", "#ffd700"];
const ADMIN_EMAILS = ["chancellor@ichancetek.com", "chanceminus@gmail.com"];

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        
        // Final security check: ensure user exists and is on the approved list
        if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            router.push("/dashboard");
            return;
        }

        authenticatedFetch("/api/admin/stats")
            .then(async (res) => {
                if (!res.ok) throw new Error("Unauthorized");
                return res.json();
            })
            .then(data => setStats(data))
            .catch(err => {
                console.error("Admin stats fetch error:", err);
                router.push("/dashboard");
            })
            .finally(() => setLoading(false));
    }, [user, authLoading, router]);

    if (authLoading || loading) return (
        <DashboardLayout>
            <div style={{ padding: "40px", textAlign: "center", color: "var(--foreground-muted)" }}>
                Validating Admin Analytics...
            </div>
        </DashboardLayout>
    );

    const cards = [
        { label: "Total Users", value: stats?.totalUsers || 0 },
        { label: "Active Sessions", value: stats?.totalSessions || 0 },
        { label: "Total Miles", value: Math.round(stats?.totalMiles || 0).toLocaleString() },
        { label: "Total Steps", value: (stats?.totalSteps || 0).toLocaleString() },
        { label: "Active (24h)", value: stats?.activeLast24h || 0 },
    ];

    return (
        <DashboardLayout>
            <header style={{ marginBottom: "40px" }}>
                <h1 style={{ fontSize: "32px", fontWeight: "bold" }}>Admin Dashboard</h1>
                <p style={{ color: "var(--foreground-muted)" }}>System Overview & Analytics</p>
            </header>

            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                {cards.map((c) => (
                    <div key={c.label} className="glass-panel" style={{ padding: "20px", borderRadius: "16px" }}>
                        <div style={{ color: "var(--foreground-muted)", fontSize: "14px", textTransform: "uppercase" }}>{c.label}</div>
                        <div style={{ fontSize: "36px", fontWeight: "bold", marginTop: "8px" }}>{c.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "20px" }}>
                {/* Activity Pie */}
                <div className="glass-panel" style={{ padding: "24px", borderRadius: "16px", minHeight: "400px" }}>
                    <h3 style={{ marginBottom: "20px" }}>Activity Distribution</h3>
                    <div style={{ height: "250px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.breakdown || []}
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats?.breakdown?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: "#222", border: "none", borderRadius: "8px", color: "#fff" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap", marginTop: "20px" }}>
                        {stats?.breakdown?.map((entry: any, index: number) => (
                            <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLORS[index % COLORS.length] }}></div>
                                {entry.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Metric Leaders Bar */}
                <div className="glass-panel" style={{ padding: "24px", borderRadius: "16px", minHeight: "400px" }}>
                    <h3 style={{ marginBottom: "20px" }}>Active Submissions</h3>
                    <div style={{ height: "300px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.breakdown || []}>
                                <XAxis dataKey="name" stroke="#666" style={{ fontSize: "12px" }} />
                                <YAxis stroke="#666" style={{ fontSize: "12px" }} />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                                    contentStyle={{ background: "#222", border: "none", borderRadius: "8px" }}
                                />
                                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
