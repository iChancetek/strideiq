"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";

interface UserData {
    uid: string;
    email: string;
    displayName: string;
    role: string;
    createdAt: any;
    disabled?: boolean;
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser] = useAuthState(auth);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modal state for password reset
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [showResetModal, setShowResetModal] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(50));
            const querySnapshot = await getDocs(q);
            const usersList: UserData[] = [];
            querySnapshot.forEach((doc) => {
                usersList.push(doc.data() as UserData);
            });
            setUsers(usersList);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: string, targetUserId: string, payload: any = {}) => {
        if (!confirm("Are you sure you want to perform this action?")) return;

        setActionLoading(targetUserId);
        try {
            const res = await fetch("/api/admin/users/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    targetUserId,
                    requesterId: currentUser?.uid,
                    ...payload
                })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Action failed");

            // Optimistic update or refetch
            if (action === "toggleStatus") {
                setUsers(prev => prev.map(u => u.uid === targetUserId ? { ...u, disabled: data.disabled } : u));
            } else if (action === "deleteUser") {
                setUsers(prev => prev.filter(u => u.uid !== targetUserId));
            } else if (action === "changeRole") {
                setUsers(prev => prev.map(u => u.uid === targetUserId ? { ...u, role: payload.role } : u));
            }

            alert("Success!");
        } catch (error: any) {
            alert(error.message);
        } finally {
            setActionLoading(null);
            setShowResetModal(false);
            setNewPassword("");
        }
    };

    const openResetModal = (user: UserData) => {
        setSelectedUser(user);
        setShowResetModal(true);
    };

    if (loading) return <div>Loading Users...</div>;

    return (
        <div>
            <header style={{ marginBottom: "40px" }}>
                <h1 style={{ fontSize: "32px", fontWeight: "bold" }}>User Management</h1>
                <p style={{ color: "var(--foreground-muted)" }}>Manage accounts, roles, and permissions</p>
            </header>

            <div className="glass-panel" style={{ borderRadius: "16px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>
                            <th style={{ padding: "16px" }}>Name</th>
                            <th style={{ padding: "16px" }}>Email</th>
                            <th style={{ padding: "16px" }}>Role</th>
                            <th style={{ padding: "16px" }}>Status</th>
                            <th style={{ padding: "16px" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.uid} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <td style={{ padding: "16px" }}>{user.displayName || "Unknown"}</td>
                                <td style={{ padding: "16px" }}>{user.email}</td>
                                <td style={{ padding: "16px" }}>
                                    <select
                                        value={user.role || "user"}
                                        onChange={(e) => handleAction("changeRole", user.uid, { role: e.target.value })}
                                        style={{ background: "#333", color: "#fff", border: "none", padding: "4px", borderRadius: "4px" }}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td style={{ padding: "16px" }}>
                                    <span style={{ color: user.disabled ? "var(--error)" : "var(--success)" }}>
                                        {user.disabled ? "Disabled" : "Active"}
                                    </span>
                                </td>
                                <td style={{ padding: "16px" }}>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            onClick={() => handleAction("toggleStatus", user.uid)}
                                            style={{ fontSize: "12px", padding: "4px 8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", cursor: "pointer" }}
                                            disabled={actionLoading === user.uid}
                                        >
                                            {user.disabled ? "Enable" : "Disable"}
                                        </button>
                                        <button
                                            onClick={() => openResetModal(user)}
                                            style={{ fontSize: "12px", padding: "4px 8px", background: "rgba(0, 229, 255, 0.2)", borderRadius: "4px", cursor: "pointer", color: "var(--secondary)" }}
                                        >
                                            Reset Pwd
                                        </button>
                                        <button
                                            onClick={() => handleAction("deleteUser", user.uid)}
                                            style={{ fontSize: "12px", padding: "4px 8px", background: "rgba(255, 0, 85, 0.2)", borderRadius: "4px", cursor: "pointer", color: "var(--error)" }}
                                            disabled={actionLoading === user.uid}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Password Reset Modal */}
            {showResetModal && selectedUser && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ padding: "30px", borderRadius: "16px", width: "400px" }}>
                        <h3>Reset Password for {selectedUser.email}</h3>
                        <input
                            type="text"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New Password"
                            style={{ width: "100%", padding: "10px", margin: "20px 0", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff" }}
                        />
                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button onClick={() => setShowResetModal(false)} style={{ padding: "10px 20px" }}>Cancel</button>
                            <button
                                onClick={() => handleAction("resetPassword", selectedUser.uid, { newPassword })}
                                className="btn-primary"
                                style={{ padding: "10px 20px" }}
                            >
                                Update Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
