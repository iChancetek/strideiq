"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import DashboardLayout from "@/components/layout/DashboardLayout";

// --- Badge Configuration ---
const BADGE_CONFIG: Record<string, { label: string; emoji: string; color: string; description: string }> = {
    "25_miles": { label: "25 Miles", emoji: "🥉", color: "#CCFF00", description: "Ran a total of 25 miles" },
    "50_miles": { label: "50 Miles", emoji: "🥈", color: "#00E5FF", description: "Ran a total of 50 miles" },
    "100_miles": { label: "100 Miles", emoji: "🥇", color: "#FF0055", description: "Ran a total of 100 miles" },
    "250_miles": { label: "250 Miles", emoji: "🏆", color: "#CCFF00", description: "Ran a total of 250 miles" },
    "500_miles": { label: "500 Miles", emoji: "🏆", color: "#00E5FF", description: "Ran a total of 500 miles" },
    "1000_miles": { label: "1K Club", emoji: "👑", color: "#FF0055", description: "Ran a total of 1,000 miles" },
};

export default function AchievementsPage() {
    const { user } = useAuth();
    const [userStats, setUserStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const fetchStats = async () => {
                try {
                    const statsRef = doc(db, "users", user.uid, "stats", "allTime");
                    const snap = await getDoc(statsRef);
                    if (snap.exists()) setUserStats(snap.data());
                } catch (e) {
                    console.error("Error fetching stats:", e);
                } finally {
                    setLoading(false);
                }
            };
            fetchStats();
        }
    }, [user]);

    const badges = userStats?.badges || [];
    const earnedSet = new Set(badges.map((b: any) => b.id));
    const records = userStats?.records || {};

    return (
        <DashboardLayout>
            <header style={{ marginBottom: "30px" }}>
                <h1 style={{ fontSize: "32px", marginBottom: "5px" }}>Achievements</h1>
                <p style={{ color: "var(--foreground-muted)" }}>Your milestones, records, and earned badges.</p>
            </header>

            {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
                    <div className="glass-panel" style={{ padding: "40px", borderRadius: "var(--radius-lg)", minHeight: "300px" }} />
                    <div className="glass-panel" style={{ padding: "40px", borderRadius: "var(--radius-lg)", minHeight: "300px" }} />
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px", alignItems: "start" }}>

                    {/* Left Column: Personal Records */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <section className="glass-panel" style={{ padding: "25px", borderRadius: "var(--radius-lg)" }}>
                            <h3 style={{ margin: 0, marginBottom: "20px", fontSize: "14px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Personal Records
                            </h3>

                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                {/* Fastest Mile */}
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                        <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--foreground-muted)" }}>Fastest Mile</span>
                                        <span style={{ fontSize: "14px" }}>⏱️</span>
                                    </div>
                                    <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
                                        {records.fastestMile ? records.fastestMile.display : "--:--"}
                                    </div>
                                </div>

                                {/* Longest Run */}
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                        <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--foreground-muted)" }}>Longest Run</span>
                                        <span style={{ fontSize: "14px" }}>📏</span>
                                    </div>
                                    <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
                                        {records.longestRun ? records.longestRun.display : "0.0 mi"}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Motivational Quote */}
                        <div className="glass-panel" style={{
                            padding: "25px",
                            borderRadius: "var(--radius-lg)",
                            textAlign: "center",
                            background: "linear-gradient(135deg, rgba(204, 255, 0, 0.05), rgba(0, 0, 0, 0))"
                        }}>
                            <p style={{ fontSize: "16px", fontStyle: "italic", fontFamily: "var(--font-heading)", lineHeight: 1.4 }}>
                                "Efficiency is the essence of survival."
                            </p>
                            <p style={{ fontSize: "11px", color: "var(--foreground-muted)", marginTop: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
                                — Your AI Coach
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Trophy Case */}
                    <section className="glass-panel" style={{ padding: "25px", borderRadius: "var(--radius-lg)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ margin: 0, fontSize: "14px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Trophy Case
                            </h3>
                            <span>🏆</span>
                        </div>

                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                            gap: "15px"
                        }}>
                            {Object.entries(BADGE_CONFIG).map(([id, config]) => {
                                const isEarned = earnedSet.has(id);

                                return (
                                    <div
                                        key={id}
                                        style={{
                                            padding: "20px 15px",
                                            borderRadius: "var(--radius-md)",
                                            background: isEarned ? "rgba(255,255,255,0.03)" : "transparent",
                                            border: isEarned ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.05)",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            textAlign: "center",
                                            opacity: isEarned ? 1 : 0.3,
                                            transition: "all 0.3s ease",
                                            cursor: "default"
                                        }}
                                    >
                                        <span style={{ fontSize: "28px", marginBottom: "10px" }}>
                                            {isEarned ? config.emoji : "🔒"}
                                        </span>
                                        <div style={{
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            marginBottom: "4px",
                                            color: isEarned ? "var(--foreground)" : "var(--foreground-muted)"
                                        }}>
                                            {config.label}
                                        </div>
                                        <div style={{
                                            fontSize: "11px",
                                            color: "var(--foreground-muted)",
                                            lineHeight: 1.3
                                        }}>
                                            {config.description}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            )}
        </DashboardLayout>
    );
}
