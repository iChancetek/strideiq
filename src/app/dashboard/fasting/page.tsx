"use client";

import FastingTimer from "@/components/dashboard/fasting/FastingTimer";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

export default function FastingPage() {
    const { user } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        async function fetchHistory() {
            try {
                const token = await user?.getIdToken();
                if (!token) return;
                const res = await fetch("/api/fasting/list", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data.logs);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, [user]);

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 16px", paddingBottom: "40px" }}>
            {/* Header */}
            <header style={{ marginBottom: "32px", textAlign: "center", position: "relative" }}>
                <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 20px",
                    borderRadius: "var(--radius-full, 24px)",
                    background: "rgba(204,255,0,0.1)",
                    border: "1px solid rgba(204,255,0,0.2)",
                    marginBottom: "12px",
                }}>
                    <span style={{ marginRight: "8px", fontSize: "18px" }}>🔥</span>
                    <span style={{ color: "var(--primary)", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "1px" }}>Metabolic Health</span>
                </div>
                <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, marginBottom: "12px" }}>
                    Fasting <span style={{ color: "var(--primary)" }}>Tracker</span>
                </h1>
                <p style={{ fontSize: "16px", color: "var(--foreground-muted)", maxWidth: "500px", margin: "0 auto", lineHeight: "1.5" }}>
                    Optimize your cellular repair and metabolic flexibility through intermittent fasting.
                </p>
            </header>

            {/* Main Content Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "24px",
            }}>
                {/* Timer Section */}
                <div className="glass-panel" style={{ padding: "clamp(20px, 4vw, 48px)", borderRadius: "16px", position: "relative", overflow: "hidden" }}>
                    <FastingTimer />
                </div>

                {/* Info Cards Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", borderRadius: "16px" }}>
                        <span style={{ fontSize: "28px", marginBottom: "10px" }}>🔬</span>
                        <h3 style={{ fontWeight: 700, fontSize: "15px" }}>Autophagy</h3>
                        <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "4px" }}>Cellular repair &amp; cleaning</p>
                    </div>
                    <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", borderRadius: "16px" }}>
                        <span style={{ fontSize: "28px", marginBottom: "10px" }}>🔥</span>
                        <h3 style={{ fontWeight: 700, fontSize: "15px" }}>Fat Burn</h3>
                        <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "4px" }}>Ketosis &amp; lipid oxidation</p>
                    </div>
                </div>

                {/* Benefits Card */}
                <div className="glass-panel" style={{ padding: "24px", borderRadius: "16px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ width: "4px", height: "20px", background: "var(--primary)", borderRadius: "2px", display: "inline-block" }} />
                        Physiological Benefits
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {[
                            { title: "Insulin Sensitivity", desc: "Lowers blood sugar & insulin resistance.", icon: "💉" },
                            { title: "HGH Production", desc: "Boosts growth hormone for muscle preservation.", icon: "💪" },
                            { title: "Mental Clarity", desc: "BDNF increase for sharper focus.", icon: "🧠" },
                            { title: "Inflammation", desc: "Reduces systemic inflammation markers.", icon: "🛡️" }
                        ].map((item, i) => (
                            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                <div style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "14px",
                                    flexShrink: 0,
                                }}>
                                    {item.icon}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: "14px" }}>{item.title}</div>
                                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Fasts */}
                <div className="glass-panel" style={{ padding: "24px", borderRadius: "16px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                        ⏱️ Recent Fasts
                    </h3>

                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ height: "48px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", animation: "pulse 1.5s infinite" }} />
                            ))}
                        </div>
                    ) : history.length === 0 ? (
                        <div style={{
                            textAlign: "center",
                            padding: "32px 16px",
                            border: "1px dashed rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                            background: "rgba(255,255,255,0.02)",
                        }}>
                            <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                                No completed fasts yet.<br />Your journey begins with the first step.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "300px", overflowY: "auto" }}>
                            {history.map(log => (
                                <div key={log.id} style={{
                                    padding: "14px 16px",
                                    borderRadius: "12px",
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{
                                            width: "36px",
                                            height: "36px",
                                            borderRadius: "8px",
                                            background: "rgba(0,0,0,0.3)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "14px",
                                        }}>
                                            📅
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: "14px" }}>
                                                {new Date(log.endTime).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                                            </div>
                                            <div style={{ fontSize: "10px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{log.type || "Custom"}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontWeight: 700, fontSize: "18px", color: "var(--primary)", fontFamily: "monospace" }}>
                                            {log.durationMinutes?.toFixed(1)}
                                        </div>
                                        <div style={{ fontSize: "10px", color: "var(--foreground-muted)" }}>hours</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
            `}</style>
        </div>
    );
}
