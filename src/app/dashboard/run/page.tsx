"use client";

import dynamic from "next/dynamic";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSettings } from "@/context/SettingsContext";
import { getActivityLabel } from "@/lib/agents/mode-agent";

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
    const { settings } = useSettings();
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
