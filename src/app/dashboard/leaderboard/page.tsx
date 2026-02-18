"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";

// Types
interface LeaderboardEntry {
    userId: string;
    displayName: string;
    photoURL?: string;
    totalMiles: number;
    avgPace: number;
    rank?: number; // Calculated on client for Friends view
}

export default function LeaderboardPage() {
    const [user] = useAuthState(auth);
    const [tab, setTab] = useState<"global" | "friends">("global");
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, [user, tab]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const url = user
                ? `/api/leaderboard?type=${tab}&userId=${user.uid}`
                : `/api/leaderboard?type=global`;

            const res = await fetch(url);
            const data = await res.json();

            // Add Rank locally (or trust API sort order)
            const sorted = (data.entries || []).map((e: LeaderboardEntry, i: number) => ({
                ...e,
                rank: i + 1
            }));

            setEntries(sorted);
        } catch (error) {
            console.error("Failed to fetch leaderboard", error);
        } finally {
            setLoading(false);
        }
    };

    const formatPace = (secondsPerMile: number) => {
        const min = Math.floor(secondsPerMile / 60);
        const sec = Math.round(secondsPerMile % 60);
        return `${min}'${sec < 10 ? '0' : ''}${sec}"/mi`;
    };

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
                <header style={{ marginBottom: "30px", textAlign: "center" }}>
                    <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}>Leaderboard</h1>
                    <p style={{ color: "var(--foreground-muted)" }}>Monthly Challenge: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>

                    <div style={{ display: "inline-flex", background: "var(--background-secondary)", padding: "5px", borderRadius: "var(--radius-full)", marginTop: "20px" }}>
                        <button
                            onClick={() => setTab("global")}
                            style={{
                                padding: "8px 24px",
                                borderRadius: "var(--radius-full)",
                                background: tab === "global" ? "var(--primary)" : "transparent",
                                color: tab === "global" ? "var(--background)" : "var(--foreground)",
                                border: "none", cursor: "pointer", fontWeight: "bold"
                            }}>Global</button>
                        <button
                            onClick={() => setTab("friends")}
                            style={{
                                padding: "8px 24px",
                                borderRadius: "var(--radius-full)",
                                background: tab === "friends" ? "var(--primary)" : "transparent",
                                color: tab === "friends" ? "var(--background)" : "var(--foreground)",
                                border: "none", cursor: "pointer", fontWeight: "bold"
                            }}>Friends</button>
                    </div>
                </header>

                <div className="glass-panel" style={{ borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                <th style={{ padding: "15px", textAlign: "left" }}>Rank</th>
                                <th style={{ padding: "15px", textAlign: "left" }}>Runner</th>
                                <th style={{ padding: "15px", textAlign: "right" }}>Miles</th>
                                <th style={{ padding: "15px", textAlign: "right" }}>Avg Pace</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => (
                                <tr key={entry.userId} style={{
                                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                                    background: user && entry.userId === user.uid ? "rgba(204, 255, 0, 0.1)" : "transparent"
                                }}>
                                    <td style={{ padding: "15px", fontWeight: "bold", color: entry.rank === 1 ? "gold" : entry.rank === 2 ? "silver" : entry.rank === 3 ? "#cd7f32" : "inherit" }}>
                                        #{entry.rank}
                                    </td>
                                    <td style={{ padding: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#333", overflow: "hidden" }}>
                                            {entry.photoURL && <img src={entry.photoURL} alt={entry.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                        </div>
                                        <span style={{ fontWeight: user && entry.userId === user.uid ? "bold" : "normal" }}>
                                            {entry.displayName} {user && entry.userId === user.uid && "(You)"}
                                        </span>
                                    </td>
                                    <td style={{ padding: "15px", textAlign: "right", fontWeight: "bold" }}>
                                        {entry.totalMiles.toFixed(1)}
                                    </td>
                                    <td style={{ padding: "15px", textAlign: "right", color: "var(--foreground-muted)" }}>
                                        {formatPace(entry.avgPace)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {entries.length === 0 && !loading && (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--foreground-muted)" }}>
                            No runners on the board yet. Be the first!
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
