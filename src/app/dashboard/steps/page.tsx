"use client";

import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useActivities } from "@/hooks/useActivities";

// ─── Types ───────────────────────────────────────────────────────────────────
type Period = "hour" | "day" | "month" | "year";

interface BucketData {
    label: string;
    steps: number;
}

const DAILY_GOAL = 10000;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getHourLabel(h: number) {
    const ampm = h >= 12 ? "PM" : "AM";
    const hr = h % 12 || 12;
    return `${hr}${ampm}`;
}

function getDayLabel(d: Date) {
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getMonthLabel(m: number, y: number) {
    return new Date(y, m).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function StepsPage() {
    const { activities, loading } = useActivities();
    const [period, setPeriod] = useState<Period>("day");

    const { buckets, totalSteps, dailyAvg } = useMemo(() => {
        const now = new Date();
        let filtered = activities.filter((a) => (a.steps ?? 0) > 0);
        const bucketMap = new Map<string, number>();
        let rangeStart: Date;

        switch (period) {
            case "hour": {
                // Last 24 hours, bucket by hour
                rangeStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                filtered = filtered.filter((a) => a.date >= rangeStart);
                for (let h = 0; h < 24; h++) {
                    const d = new Date(rangeStart.getTime() + h * 60 * 60 * 1000);
                    bucketMap.set(getHourLabel(d.getHours()), 0);
                }
                filtered.forEach((a) => {
                    const key = getHourLabel(a.date.getHours());
                    bucketMap.set(key, (bucketMap.get(key) || 0) + (a.steps ?? 0));
                });
                break;
            }
            case "day": {
                // Last 7 days, bucket by day
                rangeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter((a) => a.date >= rangeStart);
                for (let d = 0; d < 7; d++) {
                    const date = new Date(rangeStart.getTime() + d * 24 * 60 * 60 * 1000);
                    bucketMap.set(getDayLabel(date), 0);
                }
                filtered.forEach((a) => {
                    const key = getDayLabel(a.date);
                    bucketMap.set(key, (bucketMap.get(key) || 0) + (a.steps ?? 0));
                });
                break;
            }
            case "month": {
                // Last 12 months
                for (let i = 11; i >= 0; i--) {
                    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    bucketMap.set(getMonthLabel(m.getMonth(), m.getFullYear()), 0);
                }
                filtered.forEach((a) => {
                    const key = getMonthLabel(a.date.getMonth(), a.date.getFullYear());
                    if (bucketMap.has(key)) {
                        bucketMap.set(key, (bucketMap.get(key) || 0) + (a.steps ?? 0));
                    }
                });
                break;
            }
            case "year": {
                // All years present
                const years = new Set(activities.map((a) => a.date.getFullYear()));
                const minYear = Math.min(...Array.from(years), now.getFullYear());
                for (let y = minYear; y <= now.getFullYear(); y++) bucketMap.set(String(y), 0);
                filtered.forEach((a) => {
                    const key = String(a.date.getFullYear());
                    if (bucketMap.has(key)) bucketMap.set(key, (bucketMap.get(key) || 0) + (a.steps ?? 0));
                });
                break;
            }
        }

        const buckets: BucketData[] = Array.from(bucketMap.entries()).map(([label, steps]) => ({ label, steps }));
        const totalSteps = buckets.reduce((sum, b) => sum + b.steps, 0);
        const numDays = period === "hour" ? 1 : period === "day" ? 7 : period === "month" ? 30 : 365;
        const dailyAvg = Math.round(totalSteps / Math.max(numDays, 1));

        return { buckets, totalSteps, dailyAvg };
    }, [activities, period]);

    const maxSteps = Math.max(...buckets.map((b) => b.steps), 1);

    // Goal ring math
    const todaySteps = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return activities.filter((a) => a.date >= today).reduce((sum, a) => sum + (a.steps ?? 0), 0);
    }, [activities]);
    const goalPct = Math.min(todaySteps / DAILY_GOAL, 1);
    const circumference = 2 * Math.PI * 54;
    const dashOffset = circumference * (1 - goalPct);

    const periods: { key: Period; label: string }[] = [
        { key: "hour", label: "Hour" },
        { key: "day", label: "Day" },
        { key: "month", label: "Month" },
        { key: "year", label: "Year" },
    ];

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
                <header style={{ marginBottom: "30px", textAlign: "center" }}>
                    <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "8px" }}>
                        👟 Steps <span className="text-gradient">Tracker</span>
                    </h1>
                    <p style={{ color: "var(--foreground-muted)" }}>Track your steps across hours, days, months, and years</p>
                </header>

                {/* Period Tabs */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "30px" }}>
                    <div style={{ display: "inline-flex", background: "var(--background-secondary)", padding: "5px", borderRadius: "var(--radius-full)" }}>
                        {periods.map((p) => (
                            <button
                                key={p.key}
                                onClick={() => setPeriod(p.key)}
                                style={{
                                    padding: "8px 24px",
                                    borderRadius: "var(--radius-full)",
                                    background: period === p.key ? "var(--primary)" : "transparent",
                                    color: period === p.key ? "var(--background)" : "var(--foreground)",
                                    border: "none",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    transition: "var(--transition-fast)",
                                }}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Top row: Goal ring + Summary */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "30px" }}>
                    {/* Goal Ring */}
                    <div className="glass-panel" style={{ padding: "24px", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <svg width="130" height="130" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                            <circle
                                cx="60" cy="60" r="54" fill="none"
                                stroke={goalPct >= 1 ? "#00e676" : "var(--primary)"}
                                strokeWidth="10"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                                strokeLinecap="round"
                                transform="rotate(-90 60 60)"
                                style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
                            />
                            <text x="60" y="55" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">
                                {todaySteps.toLocaleString()}
                            </text>
                            <text x="60" y="73" textAnchor="middle" fill="var(--foreground-muted)" fontSize="11">
                                / {DAILY_GOAL.toLocaleString()}
                            </text>
                        </svg>
                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "8px" }}>Today&apos;s Goal</div>
                    </div>

                    {/* Total Steps */}
                    <div className="glass-panel" style={{ padding: "24px", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Total Steps</div>
                        <div style={{ fontSize: "36px", fontWeight: "bold", color: "var(--primary)" }}>{totalSteps.toLocaleString()}</div>
                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "4px" }}>
                            {period === "hour" ? "Last 24h" : period === "day" ? "Last 7 days" : period === "month" ? "Last 12 months" : "All time"}
                        </div>
                    </div>

                    {/* Daily Average */}
                    <div className="glass-panel" style={{ padding: "24px", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Daily Avg</div>
                        <div style={{ fontSize: "36px", fontWeight: "bold" }}>{dailyAvg.toLocaleString()}</div>
                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "4px" }}>steps/day</div>
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="glass-panel" style={{ padding: "24px", borderRadius: "var(--radius-lg)", marginBottom: "30px" }}>
                    <h3 style={{ marginBottom: "20px", fontSize: "16px" }}>Steps Breakdown</h3>
                    {loading ? (
                        <p style={{ color: "var(--foreground-muted)" }}>Loading...</p>
                    ) : (
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "180px", padding: "0 4px" }}>
                            {buckets.map((b) => (
                                <div key={b.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
                                    <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                                        <div
                                            style={{
                                                width: "100%",
                                                maxWidth: "40px",
                                                height: `${Math.max((b.steps / maxSteps) * 100, 2)}%`,
                                                background: b.steps > 0
                                                    ? "linear-gradient(to top, var(--primary), rgba(204,255,0,0.6))"
                                                    : "rgba(255,255,255,0.05)",
                                                borderRadius: "4px 4px 0 0",
                                                transition: "height 0.4s ease",
                                                position: "relative",
                                            }}
                                            title={`${b.label}: ${b.steps.toLocaleString()} steps`}
                                        >
                                            {b.steps > 0 && (
                                                <div style={{
                                                    position: "absolute",
                                                    top: "-20px",
                                                    left: "50%",
                                                    transform: "translateX(-50%)",
                                                    fontSize: "9px",
                                                    color: "var(--foreground-muted)",
                                                    whiteSpace: "nowrap",
                                                }}>
                                                    {b.steps >= 1000 ? `${(b.steps / 1000).toFixed(1)}k` : b.steps}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: "9px",
                                        color: "var(--foreground-muted)",
                                        marginTop: "6px",
                                        textAlign: "center",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "50px",
                                    }}>
                                        {b.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Breakdown Table */}
                <div className="glass-panel" style={{ borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", textTransform: "uppercase", color: "var(--foreground-muted)" }}>Period</th>
                                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", textTransform: "uppercase", color: "var(--foreground-muted)" }}>Steps</th>
                                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", textTransform: "uppercase", color: "var(--foreground-muted)" }}>% of Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {buckets.map((b) => (
                                <tr key={b.label} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                    <td style={{ padding: "12px 16px", fontWeight: 500 }}>{b.label}</td>
                                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>{b.steps.toLocaleString()}</td>
                                    <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--foreground-muted)" }}>
                                        {totalSteps > 0 ? `${((b.steps / totalSteps) * 100).toFixed(1)}%` : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
