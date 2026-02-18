"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";

interface StepsEntry {
    userId: string;
    displayName: string;
    photoURL?: string;
    totalSteps: number;
    totalRuns: number;
    rank?: number;
}

export default function StepsLeaderboardPage() {
    const [user] = useAuthState(auth);
    const [tab, setTab] = useState<"global" | "friends">("global");
    const [entries, setEntries] = useState<StepsEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, [user, tab]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const url = user
                ? `/api/steps-leaderboard?type=${tab}&userId=${user.uid}`
                : `/api/steps-leaderboard?type=global`;

            const res = await fetch(url);
            const data = await res.json();

            const sorted = (data.entries || []).map((e: StepsEntry, i: number) => ({
                ...e,
                rank: i + 1,
            }));

            setEntries(sorted);
        } catch (error) {
            console.error("Failed to fetch steps leaderboard", error);
        } finally {
            setLoading(false);
        }
    };

    const formatSteps = (steps: number) => {
        if (steps >= 1_000_000) return `${(steps / 1_000_000).toFixed(1)}M`;
        if (steps >= 1_000) return `${(steps / 1_000).toFixed(1)}K`;
        return steps.toLocaleString();
    };

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
                <header style={{ marginBottom: "30px", textAlign: "center" }}>
                    <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}>
                        🥇 Steps <span className="text-gradient">Leaderboard</span>
                    </h1>
                    <p style={{ color: "var(--foreground-muted)" }}>
                        Monthly Challenge: {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
                    </p>

                    <div style={{ display: "inline-flex", background: "var(--background-secondary)", padding: "5px", borderRadius: "var(--radius-full)", marginTop: "20px" }}>
                        <button
                            onClick={() => setTab("global")}
                            style={{
                                padding: "8px 24px",
                                borderRadius: "var(--radius-full)",
                                background: tab === "global" ? "var(--primary)" : "transparent",
                                color: tab === "global" ? "var(--background)" : "var(--foreground)",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: "bold",
                            }}
                        >
                            Global
                        </button>
                        <button
                            onClick={() => setTab("friends")}
                            style={{
                                padding: "8px 24px",
                                borderRadius: "var(--radius-full)",
                                background: tab === "friends" ? "var(--primary)" : "transparent",
                                color: tab === "friends" ? "var(--background)" : "var(--foreground)",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: "bold",
                            }}
                        >
                            Friends
                        </button>
                    </div>
                </header>

                <div className="glass-panel" style={{ borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                <th style={{ padding: "15px", textAlign: "left" }}>Rank</th>
                                <th style={{ padding: "15px", textAlign: "left" }}>Runner</th>
                                <th style={{ padding: "15px", textAlign: "right" }}>Steps</th>
                                <th style={{ padding: "15px", textAlign: "right" }}>Daily Avg</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => {
                                const now = new Date();
                                const dayOfMonth = now.getDate();
                                const dailyAvg = dayOfMonth > 0 ? Math.round(entry.totalSteps / dayOfMonth) : 0;

                                return (
                                    <tr
                                        key={entry.userId}
                                        style={{
                                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                                            background: user && entry.userId === user.uid ? "rgba(204, 255, 0, 0.1)" : "transparent",
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: "15px",
                                                fontWeight: "bold",
                                                color:
                                                    entry.rank === 1 ? "gold" : entry.rank === 2 ? "silver" : entry.rank === 3 ? "#cd7f32" : "inherit",
                                            }}
                                        >
                                            {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                                        </td>
                                        <td style={{ padding: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                                            <div
                                                style={{
                                                    width: "32px",
                                                    height: "32px",
                                                    borderRadius: "50%",
                                                    background: "#333",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                {entry.photoURL && (
                                                    <img src={entry.photoURL} alt={entry.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                )}
                                            </div>
                                            <span style={{ fontWeight: user && entry.userId === user.uid ? "bold" : "normal" }}>
                                                {entry.displayName} {user && entry.userId === user.uid && "(You)"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "15px", textAlign: "right", fontWeight: "bold", color: "var(--primary)" }}>
                                            {formatSteps(entry.totalSteps)}
                                        </td>
                                        <td style={{ padding: "15px", textAlign: "right", color: "var(--foreground-muted)" }}>
                                            {dailyAvg.toLocaleString()}/day
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {entries.length === 0 && !loading && (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--foreground-muted)" }}>
                            No step data yet. Go for a run or walk to start tracking!
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
