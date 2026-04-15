"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import Link from "next/link";
import SpeechControls from "@/components/dashboard/SpeechControls";
import { useVoice } from "@/hooks/useVoice";
import { Volume2 } from "lucide-react";

interface LeaderboardEntry {
    userId: string;
    displayName: string;
    photoURL?: string;
    totalMiles: number;
    totalSteps?: number;
    avgPace: number;
    rank?: number;
}

export default function LeaderboardPage() {
    const [user] = useAuthState(auth);
    const [tab, setTab] = useState<"global" | "friends">("global");
    const [sortBy, setSortBy] = useState<"totalMiles" | "totalSteps">("totalMiles");
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isPlaying, speak, stopSpeaking } = useVoice();

    useEffect(() => {
        fetchLeaderboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, tab, sortBy]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const url = user
                ? `/api/leaderboard?type=${tab}&userId=${user.uid}&sortBy=${sortBy}`
                : `/api/leaderboard?type=global&sortBy=${sortBy}`;

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
    const handleListen = () => {
        if (entries.length === 0) {
            speak("The leaderboard is currently empty.");
            return;
        }

        const topThree = entries.slice(0, 3).map(e => `Rank ${e.rank}, ${e.displayName}, with ${sortBy === 'totalMiles' ? e.totalMiles.toFixed(1) + ' miles' : e.totalSteps + ' steps'}`).join(". ");
        const myEntry = user ? entries.find(e => e.userId === user.uid) : null;
        const myStatus = myEntry ? `You are currently ranked number ${myEntry.rank}.` : "";
        
        speak(`Leaderboard challenge for ${new Date().toLocaleString("default", { month: "long" })}. The top three athletes are: ${topThree}. ${myStatus}`);
    };

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
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

                <header style={{ marginBottom: "30px", textAlign: "center", position: "relative" }}>
                    <div style={{ position: "absolute", top: 0, right: 0 }}>
                        <SpeechControls 
                            onSpeak={handleListen}
                            onStopSpeaking={stopSpeaking}
                            isPlaying={isPlaying}
                            showMic={false}
                            size={16}
                            label={isPlaying ? "Stop" : "Listen"}
                        />
                    </div>
                    <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}>🏆 Leaderboard</h1>
                    <p style={{ color: "var(--foreground-muted)" }}>Monthly Challenge: {new Date().toLocaleString("default", { month: "long", year: "numeric" })}</p>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginTop: "20px" }}>
                        <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", padding: "4px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                            {(["global", "friends"] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    style={{
                                        padding: "6px 20px",
                                        borderRadius: "8px",
                                        background: tab === t ? "var(--primary)" : "transparent",
                                        color: tab === t ? "#000" : "var(--foreground-muted)",
                                        border: "none",
                                        cursor: "pointer",
                                        fontWeight: "bold",
                                        fontSize: "13px",
                                        transition: "all 0.2s",
                                        textTransform: "capitalize",
                                    }}
                                >
                                    {t === "global" ? "🌍 Global" : "👥 Friends"}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: "inline-flex", background: "rgba(0,0,0,0.2)", padding: "4px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                            {(["totalMiles", "totalSteps"] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSortBy(s)}
                                    style={{
                                        padding: "4px 16px",
                                        borderRadius: "6px",
                                        background: sortBy === s ? "rgba(255,255,255,0.1)" : "transparent",
                                        color: sortBy === s ? "var(--primary)" : "var(--foreground-muted)",
                                        border: "none",
                                        cursor: "pointer",
                                        fontWeight: 600,
                                        fontSize: "12px",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {s === "totalMiles" ? "Mileage" : "Steps"}
                                </button>
                            ))}
                        </div>
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
                            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>No activity here yet</h3>
                            <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "20px" }}>
                                {tab === "friends"
                                    ? "None of your friends have logged activity this month."
                                    : "Complete a session to appear here!"}
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
                                Get Started
                            </Link>
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                                <thead>
                                    <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "var(--foreground-muted)", textTransform: "uppercase" }}>Rank</th>
                                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "var(--foreground-muted)", textTransform: "uppercase" }}>Runner</th>
                                        <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", color: "var(--foreground-muted)", textTransform: "uppercase" }}>Miles</th>
                                        <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", color: "var(--foreground-muted)", textTransform: "uppercase" }}>Steps</th>
                                        <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", color: "var(--foreground-muted)", textTransform: "uppercase" }}>Avg Pace</th>
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
                                                <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, color: sortBy === 'totalMiles' ? "var(--primary)" : "var(--foreground)" }}>
                                                    {(Number(entry.totalMiles) || 0).toFixed(1)}
                                                </td>
                                                <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, color: sortBy === 'totalSteps' ? "var(--primary)" : "var(--foreground)" }}>
                                                    {(Number(entry.totalSteps) || 0).toLocaleString()}
                                                </td>
                                                <td style={{ padding: "14px 16px", textAlign: "right", color: "var(--foreground-muted)", fontSize: "14px" }}>
                                                    {formatPace(entry.avgPace)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            <style jsx>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        </DashboardLayout>
    );
}
