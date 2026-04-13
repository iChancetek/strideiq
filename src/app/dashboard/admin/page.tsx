"use client";

import { useEffect, useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, AreaChart, Area } from "recharts";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { authenticatedFetch } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const COLORS = ["#ccff00", "#00e5ff", "#ff0055", "#ffd700", "#8a2be2", "#ff8c00"];
const ADMIN_EMAILS = ["chancellor@ichancetek.com", "chanceminus@gmail.com"];

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"overview" | "users">("overview");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            router.push("/dashboard");
            return;
        }

        const fetchData = async () => {
            try {
                const [statsRes, usersRes] = await Promise.all([
                    authenticatedFetch("/api/admin/stats"),
                    authenticatedFetch("/api/admin/users")
                ]);

                if (!statsRes.ok || !usersRes.ok) throw new Error("Unauthorized");

                const statsData = await statsRes.json();
                const usersData = await usersRes.json();

                setStats(statsData);
                setUsers(usersData.users || []);
            } catch (err) {
                console.error("Admin data fetch error:", err);
                // router.push("/dashboard");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, authLoading, router]);

    const filteredUsers = useMemo(() => {
        return users.filter(u => 
            u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.uid?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const handleUserAction = async (uid: string, action: string, data?: any) => {
        if (!confirm(`Are you sure you want to perform "${action}" on this user?`)) return;
        
        setActionLoading(true);
        try {
            const res = await authenticatedFetch("/api/admin/users/action", {
                method: "POST",
                body: JSON.stringify({ uid, action, data })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Action failed");
            }

            // Refresh users
            const usersRes = await authenticatedFetch("/api/admin/users");
            const usersData = await usersRes.json();
            setUsers(usersData.users || []);
            
            setShowEditModal(false);
            setNewPassword("");
            setSelectedUser({ ...selectedUser, displayName: data?.profile?.displayName || selectedUser.displayName });
            alert(`Action "${action}" completed successfully.`);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (authLoading || loading) return (
        <DashboardLayout>
            <div style={{ padding: "100px 40px", textAlign: "center", color: "var(--foreground-muted)", fontSize: "1.2rem" }}>
                <div className="spinner" style={{ marginBottom: "20px" }}></div>
                Establishing Secure Admin Connection...
            </div>
        </DashboardLayout>
    );

    const cards = [
        { label: "Total Community", value: stats?.totalUsers || 0, icon: "👥" },
        { label: "Active Sessions", value: stats?.totalSessions || 0, icon: "⚡" },
        { label: "Platform Miles", value: Math.round(stats?.totalMiles || 0).toLocaleString(), icon: "🛣️" },
        { label: "Daily Active", value: stats?.activeLast24h || 0, icon: "🔥" },
    ];

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
                <header style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                        <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: "900", letterSpacing: "-1px", marginBottom: "8px" }}>
                            Admin <span className="text-gradient">Control Center</span>
                        </h1>
                        <p style={{ color: "var(--foreground-muted)", fontSize: "16px" }}>Elite management nexus for StrideIQ.</p>
                    </div>
                    
                    <div className="glass-panel" style={{ padding: "6px", borderRadius: "14px", display: "flex", gap: "5px" }}>
                        <button 
                            onClick={() => setActiveTab("overview")}
                            style={{ 
                                padding: "10px 24px", 
                                borderRadius: "10px", 
                                border: "none", 
                                background: activeTab === "overview" ? "var(--primary)" : "transparent",
                                color: activeTab === "overview" ? "#000" : "var(--foreground-muted)",
                                fontWeight: "700",
                                cursor: "pointer",
                                transition: "all 0.3s ease"
                            }}
                        >
                            Overview
                        </button>
                        <button 
                            onClick={() => setActiveTab("users")}
                            style={{ 
                                padding: "10px 24px", 
                                borderRadius: "10px", 
                                border: "none", 
                                background: activeTab === "users" ? "var(--primary)" : "transparent",
                                color: activeTab === "users" ? "#000" : "var(--foreground-muted)",
                                fontWeight: "700",
                                cursor: "pointer",
                                transition: "all 0.3s ease"
                            }}
                        >
                            User Mgmt
                        </button>
                    </div>
                </header>

                {activeTab === "overview" ? (
                    <>
                        {/* KPI Cards */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "25px", marginBottom: "40px" }}>
                            {cards.map((c) => (
                                <div key={c.label} className="glass-panel" style={{ padding: "28px", borderRadius: "24px", position: "relative", overflow: "hidden" }}>
                                    <div style={{ position: "absolute", top: "-10px", right: "-10px", fontSize: "60px", opacity: 0.05 }}>{c.icon}</div>
                                    <div style={{ color: "var(--foreground-muted)", fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>{c.label}</div>
                                    <div style={{ fontSize: "42px", fontWeight: "900", marginTop: "12px", color: "var(--primary)" }}>{c.value}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "30px", marginBottom: "40px" }}>
                            {/* Growth Area Chart */}
                            <div className="glass-panel" style={{ padding: "30px", borderRadius: "28px", height: "450px" }}>
                                <div style={{ marginBottom: "25px" }}>
                                    <h3 style={{ fontSize: "20px", fontWeight: "800" }}>Community Growth</h3>
                                    <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>New monthly registrations.</p>
                                </div>
                                <ResponsiveContainer width="100%" height="80%">
                                    <AreaChart data={stats?.growth || []}>
                                        <defs>
                                            <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} />
                                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} />
                                        <Tooltip 
                                            contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} 
                                        />
                                        <Area type="monotone" dataKey="value" stroke="var(--primary)" fillOpacity={1} fill="url(#colorGrowth)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Intensity Bar Chart */}
                            <div className="glass-panel" style={{ padding: "30px", borderRadius: "28px", height: "450px" }}>
                                <div style={{ marginBottom: "25px" }}>
                                    <h3 style={{ fontSize: "20px", fontWeight: "800" }}>Activity Distribution</h3>
                                    <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>Platform utilization by type.</p>
                                </div>
                                <ResponsiveContainer width="100%" height="80%">
                                    <BarChart data={stats?.breakdown || []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} />
                                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} />
                                        <Tooltip 
                                            cursor={{ fill: "rgba(255,255,255,0.03)" }}
                                            contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} 
                                        />
                                        <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart Section */}
                        <div className="glass-panel" style={{ padding: "30px", borderRadius: "28px", minHeight: "300px" }}>
                             <div style={{ marginBottom: "25px", textAlign: "center" }}>
                                <h3 style={{ fontSize: "20px", fontWeight: "800" }}>User Engagement Profile</h3>
                                <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>Snapshot of current activity mix.</p>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-around" }}>
                                <div style={{ width: "300px", height: "300px" }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats?.breakdown || []}
                                                innerRadius={70}
                                                outerRadius={100}
                                                paddingAngle={8}
                                                dataKey="value"
                                            >
                                                {stats?.breakdown?.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: "#111", borderRadius: "12px" }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                                    {stats?.breakdown?.map((entry: any, index: number) => (
                                        <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <div style={{ width: "12px", height: "12px", borderRadius: "4px", background: COLORS[index % COLORS.length] }}></div>
                                            <div style={{ fontSize: "14px", fontWeight: "600" }}>{entry.name}</div>
                                            <div style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>{entry.value} sessions</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="glass-panel" style={{ padding: "30px", borderRadius: "28px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                            <h3 style={{ fontSize: "24px", fontWeight: "800" }}>User Management</h3>
                            <div style={{ position: "relative", width: "300px" }}>
                                <input 
                                    type="text" 
                                    placeholder="Search by name, email, or UID..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ 
                                        width: "100%", 
                                        padding: "12px 20px", 
                                        borderRadius: "12px", 
                                        border: "1px solid rgba(255,255,255,0.1)", 
                                        background: "rgba(255,255,255,0.05)",
                                        color: "#fff",
                                        fontSize: "14px"
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                        <th style={{ padding: "16px", color: "var(--foreground-muted)", fontSize: "12px", textTransform: "uppercase" }}>User</th>
                                        <th style={{ padding: "16px", color: "var(--foreground-muted)", fontSize: "12px", textTransform: "uppercase" }}>Joined</th>
                                        <th style={{ padding: "16px", color: "var(--foreground-muted)", fontSize: "12px", textTransform: "uppercase" }}>Last Active</th>
                                        <th style={{ padding: "16px", color: "var(--foreground-muted)", fontSize: "12px", textTransform: "uppercase" }}>Status</th>
                                        <th style={{ padding: "16px", color: "var(--foreground-muted)", fontSize: "12px", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <tr key={u.uid} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }} className="table-row-hover">
                                            <td style={{ padding: "16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                                                        {u.photoURL ? <img src={u.photoURL} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : u.displayName?.[0] || "?"}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: "700", fontSize: "15px" }}>{u.displayName || "Unknown User"}</div>
                                                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: "16px", fontSize: "14px" }}>
                                                {new Date(u.creationTime || u.createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: "16px", fontSize: "14px" }}>
                                                {u.lastSignInTime ? new Date(u.lastSignInTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "Never"}
                                            </td>
                                            <td style={{ padding: "16px" }}>
                                                <span style={{ 
                                                    padding: "4px 12px", 
                                                    borderRadius: "20px", 
                                                    fontSize: "11px", 
                                                    fontWeight: "800",
                                                    background: u.disabled ? "rgba(255,0,85,0.1)" : "rgba(204,255,0,0.1)",
                                                    color: u.disabled ? "#ff0055" : "#ccff00"
                                                }}>
                                                    {u.disabled ? "DISABLED" : "ACTIVE"}
                                                </span>
                                            </td>
                                            <td style={{ padding: "16px", textAlign: "right" }}>
                                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                                    <button 
                                                        onClick={() => { setSelectedUser(u); setShowEditModal(true); }}
                                                        style={{ background: "rgba(255,255,255,0.1)", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUserAction(u.uid, u.disabled ? "enable" : "disable")}
                                                        disabled={actionLoading}
                                                        style={{ 
                                                            background: u.disabled ? "rgba(204,255,0,0.1)" : "rgba(255,255,255,0.05)", 
                                                            color: u.disabled ? "#ccff00" : "#fff",
                                                            border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "700" 
                                                        }}
                                                    >
                                                        {u.disabled ? "Enable" : "Disable"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit / Password Modal */}
            {showEditModal && selectedUser && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div className="glass-panel" style={{ width: "100%", maxWidth: "500px", padding: "40px", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px" }}>
                            <div>
                                <h3 style={{ fontSize: "24px", fontWeight: "900" }}>Manage Account</h3>
                                <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>{selectedUser.displayName} ({selectedUser.email})</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "24px" }}>&times;</button>
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "8px", color: "var(--foreground-muted)", textTransform: "uppercase" }}>Update Profile Detail</label>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <input 
                                    type="text" 
                                    placeholder="Enter new display name..." 
                                    defaultValue={selectedUser.displayName}
                                    id="edit-display-name"
                                    style={{ flex: 1, padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "#000", color: "#fff" }}
                                />
                                <button 
                                    onClick={() => {
                                        const val = (document.getElementById("edit-display-name") as HTMLInputElement).value;
                                        handleUserAction(selectedUser.uid, "edit", { profile: { displayName: val } });
                                    }}
                                    disabled={actionLoading}
                                    className="btn-primary"
                                    style={{ padding: "0 20px" }}
                                >
                                    Sync
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: "30px" }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "8px", color: "var(--foreground-muted)", textTransform: "uppercase" }}>Administrative Password Reset</label>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <input 
                                    type="password" 
                                    placeholder="Enter new master password..." 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    style={{ flex: 1, padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "#000", color: "#fff" }}
                                />
                                <button 
                                    onClick={() => handleUserAction(selectedUser.uid, "update-password", { password: newPassword })}
                                    disabled={!newPassword || actionLoading}
                                    className="btn-primary"
                                    style={{ padding: "0 20px" }}
                                >
                                    Update
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: "30px" }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "8px", color: "var(--foreground-muted)", textTransform: "uppercase" }}>Security Management</label>
                            <button 
                                onClick={() => handleUserAction(selectedUser.uid, "revoke-session")}
                                disabled={actionLoading}
                                style={{ 
                                    width: "100%", 
                                    padding: "12px", 
                                    borderRadius: "12px", 
                                    background: "rgba(255, 140, 0, 0.1)", 
                                    color: "#ff8c00", 
                                    border: "1px solid #ff8c00", 
                                    fontWeight: "700", 
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 140, 0, 0.2)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(255, 140, 0, 0.1)"}
                            >
                                Terminate All Active Sessions
                            </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                             <button 
                                onClick={() => handleUserAction(selectedUser.uid, "delete")}
                                disabled={actionLoading}
                                style={{ background: "rgba(255,0,85,0.1)", color: "#ff0055", border: "1px solid #ff0055", padding: "15px", borderRadius: "16px", cursor: "pointer", fontWeight: "700" }}
                            >
                                DELETE ACCOUNT
                            </button>
                             <button 
                                onClick={() => setShowEditModal(false)}
                                style={{ background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", padding: "15px", borderRadius: "16px", cursor: "pointer", fontWeight: "700" }}
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .text-gradient {
                    background: linear-gradient(90deg, var(--primary), #00e5ff);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .table-row-hover:hover {
                    background: rgba(255,255,255,0.03);
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid rgba(255,255,255,0.1);
                    border-top: 4px solid var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </DashboardLayout>
    );
}
