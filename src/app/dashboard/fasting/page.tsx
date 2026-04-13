"use client";

import FastingTimer from "@/components/dashboard/fasting/FastingTimer";
import { useAuth } from "@/context/AuthContext";
import { useActivities } from "@/hooks/useActivities";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Trash2, Edit2, Loader2 } from "lucide-react";

export default function FastingPage() {
    const { user } = useAuth();
    const { activities, loading, deleteActivity, updateActivity } = useActivities();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Filter and format fasting history
    const history = useMemo(() => {
        return activities
            .filter(a => a.type === "Fasting")
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [activities]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this fast?")) return;
        setIsDeleting(id);
        try {
            await deleteActivity(id);
        } catch (e) {
            console.error(e);
            alert("Failed to delete activity");
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 16px", paddingBottom: "40px" }}>
            {/* Back Arrow */}
            <div style={{ marginBottom: "16px", marginTop: "8px" }}>
                <Link href="/dashboard" style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--foreground-muted)",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 600,
                    transition: "color 0.2s",
                }}>
                    ← Dashboard
                </Link>
            </div>

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
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto" }}>
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
                                                {new Date(log.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                                            </div>
                                            <div style={{ fontSize: "10px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{log.mode || "Custom"}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontWeight: 700, fontSize: "18px", color: "var(--primary)", fontFamily: "monospace" }}>
                                                {(Number(log.duration) / 3600).toFixed(1)}
                                            </div>
                                            <div style={{ fontSize: "10px", color: "var(--foreground-muted)" }}>hours</div>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button 
                                                onClick={() => handleDelete(log.id)}
                                                disabled={isDeleting === log.id}
                                                style={{ background: "transparent", border: "none", color: "rgba(255,50,50,0.6)", cursor: "pointer", padding: "4px" }}
                                            >
                                                {isDeleting === log.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            </button>
                                        </div>
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
