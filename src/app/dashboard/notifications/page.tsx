"use client";

import { useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useNotifications } from "@/hooks/useNotifications";
import Link from "next/link";

export default function NotificationsPage() {
    const { notifications, loading, markAllAsRead, markAsRead } = useNotifications();

    useEffect(() => {
        // Mark all as read after a short delay to let user see them
        const timer = setTimeout(() => {
            markAllAsRead();
        }, 2000);
        return () => clearTimeout(timer);
    }, [notifications, markAllAsRead]);

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
                <header style={{ marginBottom: "30px" }}>
                    <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>
                        🔔 Notifications
                    </h1>
                    <p style={{ color: "var(--foreground-muted)" }}>Stay updated with likes and comments on your activities</p>
                </header>

                {loading ? (
                    <div className="glass-panel" style={{ padding: "40px", textAlign: "center", borderRadius: "16px" }}>
                        <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
                        <p style={{ color: "var(--foreground-muted)" }}>Fetching your notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="glass-panel" style={{ padding: "60px 40px", textAlign: "center", borderRadius: "24px" }}>
                        <div style={{ fontSize: "40px", marginBottom: "16px" }}>📦</div>
                        <h3 style={{ marginBottom: "8px" }}>All caught up!</h3>
                        <p style={{ color: "var(--foreground-muted)" }}>Notifications about likes and comments will appear here.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: "12px" }}>
                        {notifications.map((n) => (
                            <Link 
                                key={n.id}
                                href={`/dashboard/activities/${n.activityId}`}
                                onClick={() => markAsRead(n.id)}
                                style={{ textDecoration: "none", color: "inherit" }}
                            >
                                <div className="glass-panel" style={{
                                    padding: "16px 20px",
                                    borderRadius: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px",
                                    transition: "var(--transition-fast)",
                                    border: n.read ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(204, 255, 0, 0.3)",
                                    background: n.read ? "rgba(255,255,255,0.02)" : "rgba(204, 255, 0, 0.05)",
                                }}>
                                    {/* Actor Photo */}
                                    <div style={{
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "50%",
                                        background: "var(--surface)",
                                        border: "2px solid var(--primary)",
                                        flexShrink: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        overflow: "hidden"
                                    }}>
                                        {n.actorPhoto ? (
                                            <img src={n.actorPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            <span style={{ fontSize: "20px" }}>👤</span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: "15px", lineHeight: "1.4" }}>
                                            <span style={{ fontWeight: 700 }}>{n.actorName}</span>
                                            {n.type === "like" ? (
                                                <span> liked your activity <span style={{ color: "var(--primary)", fontWeight: 600 }}>"{n.activityTitle}"</span> {n.emoji}</span>
                                            ) : (
                                                <span> commented on <span style={{ color: "var(--primary)", fontWeight: 600 }}>"{n.activityTitle}"</span>: "{n.content}"</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "4px" }}>
                                            {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : "Just now"}
                                        </div>
                                    </div>

                                    {/* Unread Indicator */}
                                    {!n.read && (
                                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--primary)", boxShadow: "0 0 10px var(--primary)" }}></div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
