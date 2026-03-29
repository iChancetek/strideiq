"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const GOAL_OPTIONS = [
    { hours: 12, label: "12h", description: "Light" },
    { hours: 16, label: "16h", description: "Popular" },
    { hours: 18, label: "18h", description: "Advanced" },
    { hours: 20, label: "20h", description: "Intense" },
    { hours: 24, label: "24h", description: "Expert" },
];

export default function FastingTimer() {
    const { user } = useAuth();
    const [isFasting, setIsFasting] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [goalHours, setGoalHours] = useState(16);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Sync with PostgreSQL / Ably
    useEffect(() => {
        if (!user) { setLoading(false); return; }

        const fetchStatus = async () => {
             try {
                 const res = await fetch(`/api/fasting/status?userId=${user.uid}`);
                 if (res.ok) {
                     const { activeSession } = await res.json();
                     if (activeSession) {
                         setStartTime(new Date(activeSession.startTime).getTime());
                         setGoalHours(activeSession.goal || 16);
                         setIsFasting(true);
                     } else {
                         setIsFasting(false);
                         setStartTime(null);
                         setElapsed(0);
                     }
                 }
             } catch (err) {
                 console.error("Error fetching fasting status:", err);
             } finally {
                 setLoading(false);
             }
        };

        fetchStatus();

        // Setup Ably
        let channel: any;
        const setupAbly = async () => {
             try {
                 const { ablyRealtime } = await import("@/lib/ably");
                 if (!ablyRealtime) return;

                 channel = ablyRealtime.channels.get(`user:${user.uid}`);
                 
                 await channel.subscribe('fasting-status-changed', () => {
                     fetchStatus(); // Re-fetch status when changed
                 });
             } catch (err) {
                 console.warn("Ably setup failed for fasting timer.", err);
             }
        };

        setupAbly();

        return () => {
            if (channel) {
                channel.unsubscribe();
            }
        };
    }, [user]);

    // Timer tick — only when fasting is active
    useEffect(() => {
        if (!isFasting || !startTime) return;
        setElapsed(Date.now() - startTime); // Immediate update on mount
        const interval = setInterval(() => setElapsed(Date.now() - startTime), 1000);
        return () => clearInterval(interval);
    }, [isFasting, startTime]);

    const toggleFasting = async () => {
        if (!user || saving) return;
        setSaving(true);
        try {
            const action = isFasting ? "stop" : "start";
            const response = await fetch("/api/fasting/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.uid,
                    action,
                    goalHours
                }),
            });

            if (!response.ok) throw new Error("Status update failed");
        } catch (e) {
            console.error("Fasting toggle error", e);
        } finally {
            setSaving(false);
        }
    };

    const formatTime = (ms: number) => {
        const totalSec = Math.floor(ms / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const progress = startTime ? Math.min((elapsed / (goalHours * 3600 * 1000)) * 100, 100) : 0;
    const goalOption = GOAL_OPTIONS.find(o => o.hours === goalHours) || GOAL_OPTIONS[1];

    // Phase label based on elapsed hours
    const elapsedHours = elapsed / 1000 / 3600;
    const phase =
        !isFasting ? "Not Started"
            : elapsedHours < 4 ? "🔄 Digestion"
                : elapsedHours < 8 ? "🏃 Fat Access"
                    : elapsedHours < 12 ? "🔥 Fat Burning"
                        : elapsedHours < 16 ? "💪 Ketosis Begins"
                            : "⚡ Deep Ketosis";

    if (loading) {
        return (
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "300px",
                flexDirection: "column",
                gap: "12px",
                color: "var(--foreground-muted)",
            }}>
                <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "3px solid var(--primary)",
                    borderTopColor: "transparent",
                    animation: "spin 0.8s linear infinite",
                }} />
                <span style={{ fontSize: "14px" }}>Loading fasting status...</span>
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "28px" }}>

            {/* Title */}
            <div style={{ textAlign: "center" }}>
                <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "4px" }}>Intermittent Fasting</h2>
                <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                    {isFasting ? phase : "Select your goal window"}
                </p>
            </div>

            {/* Circular Timer */}
            <div style={{ position: "relative", width: "220px", height: "220px", flexShrink: 0 }}>
                {/* Background ring */}
                <svg width="220" height="220" style={{ position: "absolute", inset: 0 }}>
                    <circle cx="110" cy="110" r="96" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
                    <circle
                        cx="110" cy="110" r="96"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 96}`}
                        strokeDashoffset={`${2 * Math.PI * 96 * (1 - progress / 100)}`}
                        transform="rotate(-90 110 110)"
                        style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                </svg>
                {/* Inner content */}
                <div style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                }}>
                    <div style={{ fontSize: "11px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                        {isFasting ? "Elapsed" : "Ready to Fast?"}
                    </div>
                    <div style={{ fontSize: "32px", fontWeight: 800, fontFamily: "monospace", letterSpacing: "-1px", color: "var(--foreground)" }}>
                        {isFasting ? formatTime(elapsed) : "0:00:00"}
                    </div>
                    {isFasting && (
                        <div style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600 }}>
                            {progress.toFixed(1)}% of {goalHours}h
                        </div>
                    )}
                </div>
            </div>

            {/* Goal Hour Selector — only when not fasting */}
            {!isFasting && (
                <div style={{ width: "100%" }}>
                    <div style={{
                        fontSize: "12px",
                        color: "var(--foreground-muted)",
                        textAlign: "center",
                        marginBottom: "14px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                    }}>
                        Choose Fasting Window
                    </div>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: "8px",
                    }}>
                        {GOAL_OPTIONS.map((opt) => {
                            const isSelected = goalHours === opt.hours;
                            return (
                                <button
                                    key={opt.hours}
                                    onClick={() => setGoalHours(opt.hours)}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "12px 4px",
                                        borderRadius: "14px",
                                        border: isSelected
                                            ? "2px solid var(--primary)"
                                            : "2px solid rgba(255,255,255,0.08)",
                                        background: isSelected
                                            ? "rgba(204,255,0,0.1)"
                                            : "rgba(255,255,255,0.03)",
                                        color: isSelected ? "var(--primary)" : "var(--foreground-muted)",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        gap: "3px",
                                    }}
                                >
                                    <span style={{ fontSize: "15px", fontWeight: 700 }}>{opt.label}</span>
                                    <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.7 }}>
                                        {opt.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* CTA Button */}
            <button
                onClick={toggleFasting}
                disabled={saving}
                style={{
                    padding: "16px 48px",
                    borderRadius: "var(--radius-full, 50px)",
                    fontWeight: 700,
                    fontSize: "16px",
                    cursor: saving ? "not-allowed" : "pointer",
                    border: "none",
                    transition: "all 0.2s ease",
                    opacity: saving ? 0.6 : 1,
                    background: isFasting
                        ? "rgba(255,50,50,0.12)"
                        : "var(--primary)",
                    color: isFasting ? "#ff5555" : "#000",
                    boxShadow: isFasting
                        ? "0 0 0 2px rgba(255,50,50,0.3)"
                        : "0 0 24px rgba(204,255,0,0.3)",
                }}
            >
                {saving ? "Saving..." : isFasting ? "⏹ End Fast" : "▶ Start Fasting"}
            </button>

            {/* Active fast info row */}
            {isFasting && startTime && (
                <div style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginTop: "-8px",
                }}>
                    <div style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "12px",
                        padding: "14px",
                        textAlign: "center",
                    }}>
                        <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "4px" }}>STARTED</div>
                        <div style={{ fontSize: "14px", fontWeight: 700 }}>
                            {new Date(startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                    </div>
                    <div style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "12px",
                        padding: "14px",
                        textAlign: "center",
                    }}>
                        <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "4px" }}>GOAL ENDS</div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--primary)" }}>
                            {new Date(startTime + goalHours * 3600 * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
