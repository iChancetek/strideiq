"use client";

import dynamic from "next/dynamic";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSettings } from "@/context/SettingsContext";
import { getActivityLabel } from "@/lib/agents/mode-agent";
import { useState } from "react";

// Dynamically import the tracker to avoid SSR issues with Leaflet
const SessionTracker = dynamic(() => import("@/components/dashboard/SessionTracker"), {
    ssr: false,
    loading: () => (
        <div style={{
            height: "500px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "var(--radius-lg)",
            color: "var(--foreground-muted)"
        }}>
            Initializing StrideIQ Agents...
        </div>
    )
});

export default function RunPage() {
    const { settings, updateSettings } = useSettings();
    const [view, setView] = useState<"selection" | "tracker">("selection");

    const MOVES = [
        { id: "run", label: "Run", icon: "🏃", color: "var(--primary)", desc: "Track pace & distance" },
        { id: "walk", label: "Walk", icon: "🚶", color: "#00E5FF", desc: "Count steps & relax" },
        { id: "bike", label: "Bike", icon: "🚴", color: "#FF9100", desc: "Speed & elevation" }
    ];

    const handleSelect = (mode: "run" | "walk" | "bike") => {
        updateSettings({ activityMode: mode });
        setView("tracker");
    };

    if (view === "selection") {
        return (
            <DashboardLayout>
                <div style={{
                    height: "calc(100vh - 100px)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "40px",
                    textAlign: "center"
                }}>
                    <div>
                        <h1 style={{ fontSize: "36px", marginBottom: "10px", fontWeight: 800 }}>Let's Get Moving</h1>
                        <p style={{ color: "var(--foreground-muted)", fontSize: "18px" }}>Select your activity to start tracking.</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "20px", width: "100%", maxWidth: "600px" }}>
                        {MOVES.map(m => (
                            <button
                                key={m.id}
                                onClick={() => handleSelect(m.id as any)}
                                className="glass-panel"
                                style={{
                                    padding: "30px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "15px",
                                    cursor: "pointer",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                    transition: "all 0.2s",
                                    background: "rgba(255,255,255,0.03)"
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = "translateY(-5px)";
                                    e.currentTarget.style.borderColor = m.color;
                                    e.currentTarget.style.background = `linear-gradient(180deg, rgba(255,255,255,0.03) 0%, ${m.color}10 100%)`;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                                }}
                            >
                                <div style={{ fontSize: "48px" }}>{m.icon}</div>
                                <div>
                                    <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "5px" }}>{m.label}</div>
                                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{m.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const label = getActivityLabel(settings.activityMode);
    const envLabel = settings.environment === "indoor" ? "Indoor" : "GPS Active";
    const envIcon = settings.environment === "indoor" ? "🏠" : "📡";

    return (
        <DashboardLayout>
            <div style={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
                <header style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 style={{ fontSize: "24px", marginBottom: "5px" }}>Live {label} Session</h1>
                        <p style={{ color: "var(--foreground-muted)" }}>{envIcon} {envLabel} • AI Coaching {settings.voiceCoaching ? "On" : "Off"}</p>
                    </div>
                    {/* Mode Badge */}
                    <div style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center"
                    }}>
                        <button
                            onClick={() => setView("selection")}
                            className="glass-panel"
                            style={{
                                padding: "6px 14px",
                                borderRadius: "var(--radius-full)",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "var(--primary)",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                cursor: "pointer",
                                border: "1px solid rgba(255,255,255,0.1)"
                            }}
                        >
                            Change Mode
                        </button>
                        <span className="glass-panel" style={{
                            padding: "6px 14px",
                            borderRadius: "var(--radius-full)",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "var(--primary)",
                            textTransform: "uppercase",
                            letterSpacing: "1px"
                        }}>
                            {settings.activityMode === "run" ? "🏃" : settings.activityMode === "walk" ? "🚶" : "🚴"} {settings.activityMode}
                        </span>
                    </div>
                </header>

                <div style={{ flex: 1, position: "relative" }}>
                    <SessionTracker />
                </div>
            </div>
        </DashboardLayout>
    );
}
