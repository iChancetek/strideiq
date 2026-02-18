"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface UserData {
    uid: string;
    email: string;
    displayName: string;
    role: string;
    createdAt: any;
}

export default function UsersTable() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

        fetchUsers();
    }, []);

    if (loading) return <div style={{ color: "var(--foreground-muted)" }}>Loading users...</div>;

    return (
        <div className="glass-panel" style={{ borderRadius: "16px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>
                        <th style={{ padding: "16px", color: "var(--foreground-muted)", fontSize: "14px", fontWeight: 600 }}>Name</th>
                        <th style={{ padding: "16px", color: "var(--foreground-muted)", fontSize: "14px", fontWeight: 600 }}>Email</th>
                        <th style={{ padding: "16px", color: "var(--foreground-muted)", fontSize: "14px", fontWeight: 600 }}>Role</th>
                        <th style={{ padding: "16px", color: "var(--foreground-muted)", fontSize: "14px", fontWeight: 600 }}>Joined</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.uid} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
                                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                                    </div>
                                    {user.displayName || "Unknown"}
                                </div>
                            </td>
                            <td style={{ padding: "16px", color: "var(--foreground-muted)" }}>{user.email}</td>
                            <td style={{ padding: "16px" }}>
                                <span style={{
                                    padding: "4px 8px",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    background: user.role === "admin" ? "rgba(204, 255, 0, 0.1)" : "rgba(255, 255, 255, 0.1)",
                                    color: user.role === "admin" ? "var(--primary)" : "var(--foreground-muted)"
                                }}>
                                    {user.role || "user"}
                                </span>
                            </td>
                            <td style={{ padding: "16px", color: "var(--foreground-muted)", fontSize: "14px" }}>
                                {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
