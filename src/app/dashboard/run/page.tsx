"use client";

import dynamic from "next/dynamic";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Dynamically import the tracker to avoid SSR issues with Leaflet
const RunTracker = dynamic(() => import("@/components/dashboard/RunTracker"), {
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
            Initializing GPS Satellites...
        </div>
    )
});

export default function RunPage() {
    return (
        <DashboardLayout>
            <div style={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
                <header style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 style={{ fontSize: "24px", marginBottom: "5px" }}>Live Run Tracking</h1>
                        <p style={{ color: "var(--foreground-muted)" }}>GPS Active • Ready to Record</p>
                    </div>
                </header>

                <div style={{ flex: 1, position: "relative" }}>
                    <RunTracker />
                </div>
            </div>
        </DashboardLayout>
    );
}
