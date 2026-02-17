"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

export default function SettingsPage() {
    return (
        <DashboardLayout>
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                <h1 style={{ marginBottom: "30px" }}>Settings</h1>

                <div className="glass-panel" style={{ padding: "20px", borderRadius: "16px", marginBottom: "20px" }}>
                    <h3 style={{ marginBottom: "15px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>Profile</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px", color: "var(--foreground-muted)" }}>Display Name</label>
                            <input type="text" placeholder="Runner" className="input-field" disabled />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px", color: "var(--foreground-muted)" }}>Email</label>
                            <input type="email" placeholder="user@example.com" className="input-field" disabled />
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: "20px", borderRadius: "16px" }}>
                    <h3 style={{ marginBottom: "15px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>Preferences</h3>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                        <span>Dark Mode</span>
                        <div style={{ opacity: 0.5 }}>On (Locked)</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Units</span>
                        <select style={{ background: "rgba(0,0,0,0.3)", color: "white", padding: "5px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.2)" }}>
                            <option>Imperial (mi)</option>
                            <option>Metric (km)</option>
                        </select>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
