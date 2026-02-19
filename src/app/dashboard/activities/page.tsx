"use client";

import { useActivities, Activity } from "@/hooks/useActivities";
import { useAuth } from "@/context/AuthContext";
import ActivityFeedCard from "@/components/dashboard/ActivityFeedCard";
import Link from "next/link";

export default function ActivitiesPage() {
    const { user } = useAuth();
    const { activities, loading } = useActivities();

    // Sort activities by date (newest first)
    const sortedActivities = [...activities].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
    );

    const weeklyStats = getWeeklyStats(activities);

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

    return (
        <div style={{ maxWidth: "640px", margin: "0 auto", paddingBottom: "40px" }}>
            {/* Header */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px",
            }}>
                <h1 style={{ fontSize: "28px", fontWeight: 800 }}>Activity Feed</h1>
                <Link
                    href="/dashboard/run"
                    style={{
                        padding: "10px 20px",
                        borderRadius: "var(--radius-full, 24px)",
                        background: "var(--primary)",
                        color: "#fff",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: 600,
                    }}
                >
                    + New Activity
                </Link>
            </div>

            {/* Weekly Summary Card */}
            <div className="glass-panel" style={{
                padding: "20px",
                borderRadius: "var(--radius-lg, 16px)",
                marginBottom: "24px",
            }}>
                <div style={{ fontSize: "13px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
                    This Week
                </div>
                <div style={{ display: "flex", gap: "32px" }}>
                    <div>
                        <div style={{ fontSize: "28px", fontWeight: 800 }}>{weeklyStats.count}</div>
                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>Activities</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "28px", fontWeight: 800 }}>{weeklyStats.distance.toFixed(1)}</div>
                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>Miles</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "28px", fontWeight: 800 }}>{formatDuration(weeklyStats.duration)}</div>
                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>Time</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "28px", fontWeight: 800 }}>{weeklyStats.calories.toLocaleString()}</div>
                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>Calories</div>
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
        </div>
    );
}

function getWeeklyStats(activities: Activity[]) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekly = activities.filter(a => a.date >= weekAgo);

    return {
        count: weekly.length,
        distance: weekly.reduce((sum, a) => sum + a.distance, 0),
        duration: weekly.reduce((sum, a) => sum + a.duration, 0),
        calories: weekly.reduce((sum, a) => sum + (a.calories || 0), 0),
    };
}

function formatDuration(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}
