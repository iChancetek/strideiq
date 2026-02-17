"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

export default function TrainingPlanPage() {
    return (
        <DashboardLayout>
            <div style={{ padding: "20px", textAlign: "center", color: "var(--foreground-muted)" }}>
                <h1 style={{ color: "var(--foreground)", marginBottom: "20px" }}>Training Plan</h1>
                <div className="glass-panel" style={{ padding: "40px", borderRadius: "var(--radius-lg)" }}>
                    <p style={{ fontSize: "18px", marginBottom: "20px" }}>
                        Your Elite AI Training Plan is being generated...
                    </p>
                    <div style={{ fontSize: "48px" }}>📅</div>
                    <p style={{ marginTop: "20px" }}>Coming Soon</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
