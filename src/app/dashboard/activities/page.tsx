"use client";

import { useActivities, Activity } from "@/hooks/useActivities";
import { useAuth } from "@/context/AuthContext";
import ActivityFeedCard from "@/components/dashboard/ActivityFeedCard";
import ActivityCharts from "@/components/dashboard/ActivityCharts";
import Link from "next/link";
import { useState, useMemo } from "react";
import ManualActivityModal from "@/components/dashboard/ManualActivityModal";
import { formatDuration } from "@/lib/utils";

type Period = "daily" | "weekly" | "monthly" | "yearly";

export default function ActivitiesPage() {
    const { user } = useAuth();
    const { activities, loading } = useActivities();
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [activePeriod, setActivePeriod] = useState<Period>("weekly");
    const [activeYear, setActiveYear] = useState(new Date().getFullYear());

    const periods: { key: Period; label: string }[] = [
        { key: "daily", label: "Daily" },
        { key: "weekly", label: "Weekly" },
        { key: "monthly", label: "Monthly" },
        { key: "yearly", label: "Yearly" },
    ];

    // Filter activities based on the selected period and year
    const filteredActivities = useMemo(() => {
        const now = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        if (activePeriod === "daily") {
            // No changes needed, start is today 00:00
        } else if (activePeriod === "weekly") {
            // Start of week (Sunday)
            const day = now.getDay();
            start.setDate(now.getDate() - day);
        } else if (activePeriod === "monthly") {
            // Start of month
            start.setDate(1);
        } else if (activePeriod === "yearly") {
            // Entire selected year
            const startOfYear = new Date(activeYear, 0, 1);
            const endOfYear = new Date(activeYear, 11, 31, 23, 59, 59);
            return activities
                .filter(a => a.date >= startOfYear && a.date <= endOfYear)
                .sort((a, b) => b.date.getTime() - a.date.getTime());
        }

        return activities
            .filter(a => a.date >= start)
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [activities, activePeriod, activeYear]);

    const stats = useMemo(() => {
        return {
            count: filteredActivities.length,
            distance: filteredActivities.reduce((sum, a) => sum + (Number(a.distance) || 0), 0),
            duration: filteredActivities.reduce((sum, a) => sum + (Number(a.duration) || 0), 0),
            calories: filteredActivities.reduce((sum, a) => sum + (Number(a.calories) || 0), 0),
            steps: filteredActivities.reduce((sum, a) => sum + (Number(a.steps) || 0), 0),
        };
    }, [filteredActivities]);

    const availableYears = useMemo(() => {
        const years = new Set<number>();
        years.add(new Date().getFullYear());
        activities.forEach(a => years.add(a.date.getFullYear()));
        return Array.from(years).sort((a, b) => b - a);
    }, [activities]);

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
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

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
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ fontSize: "13px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                            {activePeriod === "daily" ? "Today" : activePeriod === "yearly" ? `Year ${activeYear}` : `This ${activePeriod.replace("ly", "")}`}
                        </div>
                        {activePeriod === "yearly" && (
                            <select 
                                value={activeYear} 
                                onChange={(e) => setActiveYear(Number(e.target.value))}
                                style={{
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "6px",
                                    color: "var(--foreground)",
                                    fontSize: "12px",
                                    padding: "2px 8px",
                                    outline: "none"
                                }}
                            >
                                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        )}
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

                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginBottom: "20px" }}>
                    <div>
                        <div style={{ fontSize: "20px", fontWeight: 800 }}>{stats.count}</div>
                        <div style={{ fontSize: "10px", color: "var(--foreground-muted)" }}>Activities</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--primary)" }}>{stats.distance.toFixed(1)}</div>
                        <div style={{ fontSize: "10px", color: "var(--foreground-muted)" }}>Miles</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "20px", fontWeight: 800 }}>{formatDuration(stats.duration)}</div>
                        <div style={{ fontSize: "10px", color: "var(--foreground-muted)" }}>Time</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "20px", fontWeight: 800 }}>{stats.calories.toLocaleString()}</div>
                        <div style={{ fontSize: "10px", color: "var(--foreground-muted)" }}>Calories</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "20px", fontWeight: 800 }}>{stats.steps.toLocaleString()}</div>
                        <div style={{ fontSize: "10px", color: "var(--foreground-muted)" }}>Steps</div>
                    </div>
                </div>

                {/* Integration of Charts */}
                <ActivityCharts activities={filteredActivities} period={activePeriod} activeYear={activeYear} />
            </div>

            {/* Feed */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {filteredActivities.length === 0 ? (
                    <div className="glass-panel" style={{
                        padding: "60px 20px",
                        textAlign: "center",
                        borderRadius: "var(--radius-lg, 16px)",
                    }}>
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏃</div>
                        <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>No activities for this period</h3>
                        <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "20px" }}>
                            Try selecting a different period or log a new activity!
                        </p>
                    </div>
                ) : (
                    filteredActivities.map((activity) => (
                        <ActivityFeedCard
                            key={activity.id}
                            activity={activity}
                            ownerName={user?.displayName || "Anonymous"}
                            ownerPhoto={user?.photoURL || undefined}
                            ownerId={user?.uid || ""}
                        />
                    ))
                )}
            </div>

            <ManualActivityModal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
            />
        </div>
    );
}


