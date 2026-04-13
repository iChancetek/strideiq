"use client";

import { useActivities, Activity } from "@/hooks/useActivities";
import { useAuth } from "@/context/AuthContext";
import ActivityFeedCard from "@/components/dashboard/ActivityFeedCard";
import Link from "next/link";
import { useState, useMemo } from "react";
import ManualActivityModal from "@/components/dashboard/ManualActivityModal";

type Period = "daily" | "weekly" | "monthly" | "yearly";

export default function ActivitiesPage() {
    const { user } = useAuth();
    const { activities, loading } = useActivities();
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [activePeriod, setActivePeriod] = useState<Period>("weekly");

    // Sort activities by date (newest first)
    const sortedActivities = useMemo(() => {
        return [...activities].sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [activities]);

    const stats = useMemo(() => {
        return getStatsForPeriod(activities, activePeriod);
    }, [activities, activePeriod]);

    if (loading) {
        return (
            <div style={{ padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "3px solid var(--primary)",
                    borderTopColor: "transparent",
                    animation: "spin 0.8s linear infinite",
                }} />
                <span style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>Loading your feed...</span>
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const periods: { key: Period; label: string }[] = [
        { key: "daily", label: "Daily" },
        { key: "weekly", label: "Weekly" },
        { key: "monthly", label: "Monthly" },
        { key: "yearly", label: "Yearly" },
    ];

    return (
        <div style={{ maxWidth: "640px", margin: "0 auto", paddingBottom: "40px" }}>
            {/* Back Arrow */}
            <div style={{ marginBottom: "12px" }}>
                <Link href="/dashboard" style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--foreground-muted)",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 600,
                }}>
                    ← Dashboard
                </Link>
            </div>

            {/* Header */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px",
            }}>
                <h1 style={{ fontSize: "28px", fontWeight: 800 }}>Activity Feed</h1>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button
                        onClick={() => setIsManualModalOpen(true)}
                        style={{
                            padding: "10px 20px",
                            borderRadius: "var(--radius-full, 24px)",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: 600,
                        }}
                    >
                        Log Manually
                    </button>
                    <Link
                        href="/dashboard/run"
                        style={{
                            padding: "10px 20px",
                            borderRadius: "var(--radius-full, 24px)",
                            background: "var(--primary)",
                            color: "#000",
                            textDecoration: "none",
                            fontSize: "14px",
                            fontWeight: 600,
                        }}
                    >
                        + New Activity
                    </Link>
                </div>
            </div>

            {/* Summary Card with Controls */}
            <div className="glass-panel" style={{
                padding: "24px",
                borderRadius: "var(--radius-lg, 16px)",
                marginBottom: "24px",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div style={{ fontSize: "13px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                        {activePeriod === "daily" ? "Today" : `This ${activePeriod.replace("ly", "")}`}
                    </div>
                    <div style={{ display: "flex", background: "rgba(0,0,0,0.2)", padding: "4px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        {periods.map(p => (
                            <button
                                key={p.key}
                                onClick={() => setActivePeriod(p.key)}
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    background: activePeriod === p.key ? "var(--primary)" : "transparent",
                                    color: activePeriod === p.key ? "#000" : "var(--foreground-muted)",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    transition: "all 0.2s"
                                }}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                    <div>
                        <div style={{ fontSize: "24px", fontWeight: 800 }}>{stats.count}</div>
                        <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>Activities</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--primary)" }}>{stats.distance.toFixed(1)}</div>
                        <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>Miles</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "24px", fontWeight: 800 }}>{formatDuration(stats.duration)}</div>
                        <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>Time</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "24px", fontWeight: 800 }}>{stats.calories.toLocaleString()}</div>
                        <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>Calories</div>
                    </div>
                </div>
            </div>

            {/* Feed */}
            {sortedActivities.length === 0 ? (
                <div className="glass-panel" style={{
                    padding: "60px 20px",
                    textAlign: "center",
                    borderRadius: "var(--radius-lg, 16px)",
                }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏃</div>
                    <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>No activities yet</h3>
                    <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "20px" }}>
                        Start your first activity and it&apos;ll appear here!
                    </p>
                    <Link
                        href="/dashboard/run"
                        className="btn-primary"
                        style={{
                            padding: "12px 28px",
                            borderRadius: "var(--radius-full, 24px)",
                            textDecoration: "none",
                            fontSize: "14px",
                            fontWeight: 600,
                        }}
                    >
                        Start Activity
                    </Link>
                </div>
            ) : (
                sortedActivities.map((activity) => (
                    <ActivityFeedCard
                        key={activity.id}
                        activity={activity}
                        ownerName={user?.displayName || "Anonymous"}
                        ownerPhoto={user?.photoURL || undefined}
                        ownerId={user?.uid || ""}
                    />
                ))
            )}

            <ManualActivityModal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
            />
        </div>
    );
}

function getStatsForPeriod(activities: Activity[], period: Period) {
    const now = new Date();
    const startTime = new Date();

    switch (period) {
        case "daily":
            startTime.setHours(0, 0, 0, 0);
            break;
        case "weekly":
            startTime.setDate(now.getDate() - 7);
            break;
        case "monthly":
            startTime.setDate(now.getDate() - 30);
            break;
        case "yearly":
            startTime.setDate(now.getDate() - 365);
            break;
    }

    const filtered = activities.filter(a => a.date >= startTime);

    return {
        count: filtered.length,
        distance: filtered.reduce((sum, a) => sum + (Number(a.distance) || 0), 0),
        duration: filtered.reduce((sum, a) => sum + (Number(a.duration) || 0), 0),
        calories: filtered.reduce((sum, a) => sum + (Number(a.calories) || 0), 0),
    };
}

function formatDuration(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}
