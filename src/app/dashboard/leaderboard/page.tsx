"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import Link from "next/link";

interface LeaderboardEntry {
    userId: string;
    displayName: string;
    photoURL?: string;
    totalMiles: number;
    avgPace: number;
    rank?: number;
}

export default function LeaderboardPage() {
    const [user] = useAuthState(auth);
    const [tab, setTab] = useState<"global" | "friends">("global");
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLeaderboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, tab]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const url = user
                ? `/api/leaderboard?type=${tab}&userId=${user.uid}`
                : `/api/leaderboard?type=global`;

            const res = await fetch(url);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();

            const sorted = (data.entries || []).map((e: LeaderboardEntry, i: number) => ({
                ...e,
                rank: i + 1
            }));
            setEntries(sorted);
        } catch (err: any) {
            console.error("Failed to fetch leaderboard", err);
            setError("Unable to load leaderboard. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const formatPace = (secondsPerMile: number) => {
        if (!secondsPerMile) return "—";
        const min = Math.floor(secondsPerMile / 60);
        const sec = Math.round(secondsPerMile % 60);
        return `${min}'${sec < 10 ? "0" : ""}${sec}"/mi`;
    };

    const rankBadge = (rank?: number) => {
        if (rank === 1) return "🥇";
        if (rank === 2) return "🥈";
        if (rank === 3) return "🥉";
        return `#${rank}`;
    };

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
                {/* Back Arrow */}
                <div style={{ marginBottom: "16px" }}>
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

                <header style={{ marginBottom: "30px", textAlign: "center" }}>
                    <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}>🏆 Leaderboard</h1>
                    <p style={{ color: "var(--foreground-muted)" }}>Monthly Challenge: {new Date().toLocaleString("default", { month: "long", year: "numeric" })}</p>

                    <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", padding: "5px", borderRadius: "var(--radius-full)", marginTop: "20px", border: "1px solid rgba(255,255,255,0.08)" }}>
                        {(["global", "friends"] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                style={{
                                    padding: "8px 24px",
                                    borderRadius: "var(--radius-full)",
                                    background: tab === t ? "var(--primary)" : "transparent",
                                    color: tab === t ? "#000" : "var(--foreground-muted)",
                                    border: "none",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                    transition: "all 0.2s",
                                    textTransform: "capitalize",
                                }}
                            >
                                {t === "global" ? "🌍 Global" : "👥 Friends"}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Error state */}
                {error && (
                    <div style={{ padding: "20px", textAlign: "center", color: "#ff6b6b", background: "rgba(255,50,50,0.08)", borderRadius: "12px", marginBottom: "20px" }}>
                        {error}
                        <button onClick={fetchLeaderboard} style={{ marginLeft: "12px", background: "none", border: "1px solid #ff6b6b", color: "#ff6b6b", borderRadius: "8px", padding: "4px 12px", cursor: "pointer", fontSize: "13px" }}>Retry</button>
                    </div>
                )}

                <div className="glass-panel" style={{ borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                    {loading ? (
                        // Loading skeleton
                        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} style={{
                                    height: "56px",
                                    borderRadius: "12px",
                                    background: "rgba(255,255,255,0.05)",
                                    animation: "pulse 1.5s ease infinite",
                                    opacity: 1 - i * 0.12,
                                }} />
                            ))}
                        </div>
                    ) : entries.length === 0 ? (
                        <div style={{ padding: "60px 20px", textAlign: "center" }}>
                            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏁</div>
                            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>No runners on the board yet</h3>
                            <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "20px" }}>
                                {tab === "friends"
                                    ? "None of your friends have logged runs this month. Challenge them!"
                                    : "Complete a run session to appear here!"}
                            </p>
                            <Link href="/dashboard/run" style={{
                                padding: "12px 28px",
                                borderRadius: "var(--radius-full)",
                                background: "var(--primary)",
                                color: "#000",
                                textDecoration: "none",
                                fontWeight: 700,
                                fontSize: "14px",
                            }}>
                                Start a Run
                            </Link>
                        </div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Rank</th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Runner</th>
                                    <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Miles</th>
                                    <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Avg Pace</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry) => {
                                    const isMe = user && entry.userId === user.uid;
                                    return (
                                        <tr key={entry.userId} style={{
                                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                                            background: isMe ? "rgba(204,255,0,0.07)" : "transparent",
                                        }}>
                                            <td style={{ padding: "14px 16px", fontWeight: 700, fontSize: "18px" }}>
                                                {rankBadge(entry.rank)}
                                            </td>
                                            <td style={{ padding: "14px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#333", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--primary)", fontSize: "14px" }}>
                                                        {entry.photoURL
                                                            ? <img src={entry.photoURL} alt={entry.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                            : (entry.displayName?.[0] || "?")
                                                        }
                                                    </div>
                                                    <span style={{ fontWeight: isMe ? 700 : 500 }}>
                                                        {entry.displayName} {isMe && <span style={{ color: "var(--primary)", fontSize: "12px" }}>(You)</span>}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, color: "var(--primary)" }}>
                                                {entry.totalMiles?.toFixed(1) ?? "0.0"}
                                            </td>
                                            <td style={{ padding: "14px 16px", textAlign: "right", color: "var(--foreground-muted)", fontSize: "14px" }}>
                                                {formatPace(entry.avgPace)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            <style jsx>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        </DashboardLayout>
    );
}

