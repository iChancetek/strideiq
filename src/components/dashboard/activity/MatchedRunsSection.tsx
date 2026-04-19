"use client";

import React from "react";
import { Activity } from "@/hooks/useActivities";

interface Props {
    activity: Activity;
}

const BEST_EFFORT_DISTANCES = [
    { label: "5K", meters: 5000, miles: 3.107 },
    { label: "2 mile", meters: 3219, miles: 2 },
    { label: "1 mile", meters: 1609, miles: 1 },
    { label: "1/2 mile", meters: 805, miles: 0.5 },
];

function formatPace(seconds: number): string {
    if (!seconds || isNaN(seconds)) return "--";
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function parsePace(paceStr: string): number {
    if (!paceStr) return 0;
    const pts = paceStr.replace(/[^0-9:]/g, "").split(":");
    if (pts.length === 2) return parseInt(pts[0]) * 60 + parseInt(pts[1]);
    return parseInt(paceStr) || 0;
}

export default function MatchedRunsSection({ activity }: Props) {
    const avgPaceSeconds = parsePace(activity.pace);
    const distance = activity.distance || 0;

    // Compute best effort times by extrapolating from avg pace
    const bestEfforts = BEST_EFFORT_DISTANCES
        .filter(d => d.miles <= distance + 0.5)
        .map(d => {
            const estPace = avgPaceSeconds * (1 + (d.miles / distance) * 0.01); // slight improvement
            const totalTime = estPace * d.miles;
            return { label: d.label, time: formatDuration(totalTime), pace: formatPace(estPace) };
        });

    // Mock matched run dates for the showcase
    const matchedRuns = [
        { label: "Today", pace: activity.pace, duration: formatDuration(activity.duration) },
        { label: "Apr 10", pace: "9:09 /mi", duration: "35:11" },
        { label: "Mar 25", pace: "9:02 /mi", duration: "34:35" },
        { label: "Oct 30, 2025", pace: "8:47 /mi", duration: "38:32" },
    ];

    return (
        <div style={{ marginBottom: "0" }}>
            {/* Matched Runs Section */}
            <div style={{ background: "var(--surface)", padding: "24px 20px", borderTop: "8px solid rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div>
                        <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "4px" }}>Matched Runs</h3>
                        <div style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600 }}>▲ Trending Faster</div>
                        <div style={{ fontSize: "28px", fontWeight: 700, marginTop: "4px" }}>{activity.pace}</div>
                    </div>
                    {/* Mini trend sparkline area */}
                    <div style={{
                        width: "100px",
                        height: "60px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        position: "relative",
                    }}>
                        <svg viewBox="0 0 100 60" style={{ width: "100%", height: "100%" }}>
                            <polyline
                                points="0,50 25,35 50,20 75,30 100,10"
                                fill="none"
                                stroke="var(--primary, #ff4d00)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <circle cx="100" cy="10" r="4" fill="var(--primary, #ff4d00)" />
                        </svg>
                    </div>
                </div>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    alignItems: "center",
                    gap: "12px",
                    fontSize: "13px"
                }}>
                    {/* Header */}
                    <div style={{ color: "var(--foreground-muted)", fontSize: "11px", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}></div>
                    <div style={{ color: "var(--foreground-muted)", fontSize: "11px", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>Pace</div>
                    <div style={{ color: "var(--foreground-muted)", fontSize: "11px", paddingBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>Time</div>

                    {/* Rows */}
                    {matchedRuns.map((run, i) => (
                        <React.Fragment key={i}>
                            <div style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontWeight: i === 0 ? 700 : 400 }}>
                                {run.label}
                                {i === 0 && <span style={{ marginLeft: "6px", fontSize: "11px", color: "var(--primary)" }}>▼</span>}
                            </div>
                            <div style={{ textAlign: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "var(--foreground-muted)" }}>{run.pace}</div>
                            <div style={{ textAlign: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "var(--foreground-muted)" }}>{run.duration}</div>
                        </React.Fragment>
                    ))}
                </div>

                <button style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary, #ff4d00)",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    padding: "16px 0 0",
                    display: "block",
                }}>
                    View 4 Matched Runs &rsaquo;
                </button>
            </div>

            {/* Best Efforts Section */}
            {bestEfforts.length > 0 && (
                <div style={{ background: "var(--surface)", padding: "24px 20px", borderTop: "8px solid rgba(255,255,255,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "20px", fontWeight: 800 }}>Best Efforts</h3>
                        <span style={{ fontSize: "28px", fontWeight: 700 }}>{bestEfforts.length}</span>
                    </div>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        padding: "4px 0 16px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        marginBottom: "12px",
                    }}>
                        <div>
                            <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "4px" }}>Best Efforts</div>
                            <div style={{ fontSize: "22px", fontWeight: 700 }}>{bestEfforts.length}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "4px" }}>Achievements</div>
                            <div style={{ fontSize: "22px", fontWeight: 700 }}>3</div>
                        </div>
                    </div>

                    {bestEfforts.map((effort, i) => (
                        <div key={i} style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            padding: "12px 0",
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                        }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: "15px", marginBottom: "2px" }}>{effort.label}</div>
                                <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{effort.time}</div>
                            </div>
                            <div style={{ color: "var(--foreground-muted)", fontSize: "13px" }}>{effort.pace} /mi</div>
                        </div>
                    ))}

                    <button style={{
                        background: "none",
                        border: "none",
                        color: "var(--primary, #ff4d00)",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: "pointer",
                        padding: "16px 0 0",
                        display: "block",
                    }}>
                        View All Results &rsaquo;
                    </button>
                </div>
            )}
        </div>
    );
}
