"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";

export default function SettingsPage() {
    const { user } = useAuth();
    const { settings, updateSettings, toggleTheme } = useSettings();

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                <h1 style={{ marginBottom: "30px" }}>Settings</h1>

                <div className="glass-panel" style={{ padding: "20px", borderRadius: "16px", marginBottom: "20px" }}>
                    <h3 style={{ marginBottom: "15px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>Profile</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px", color: "var(--foreground-muted)" }}>Display Name</label>
                            <input
                                type="text"
                                value={user?.displayName || ""}
                                className="input-field"
                                disabled
                                style={{ color: "var(--foreground)" }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px", color: "var(--foreground-muted)" }}>Email</label>
                            <input
                                type="email"
                                value={user?.email || ""}
                                className="input-field"
                                disabled
                                style={{ color: "var(--foreground)" }}
                            />
                        </div>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: "20px", borderRadius: "16px" }}>
                    <h3 style={{ marginBottom: "15px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>Preferences</h3>

                    {/* Theme Toggle */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <span>Theme Mode</span>
                        <button
                            onClick={toggleTheme}
                            style={{
                                background: "rgba(0,0,0,0.3)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                padding: "8px 16px",
                                borderRadius: "20px",
                                color: "var(--foreground)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}
                        >
                            <div style={{
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                background: settings.theme === "light" ? "#FFCC00" : "#CCFF00"
                            }} />
                            {settings.theme === "light" ? "Light Mode" : "Dark Mode"}
                        </button>
                    </div>

                    {/* Units Select */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Units</span>
                        <select
                            value={settings.units}
                            onChange={(e) => updateSettings({ units: e.target.value as "imperial" | "metric" })}
                            style={{
                                background: "rgba(0,0,0,0.3)",
                                color: "var(--foreground)",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: "1px solid rgba(255,255,255,0.2)",
                                outline: "none"
                            }}
                        >
                            <option value="imperial">Imperial (mi)</option>
                            <option value="metric">Metric (km)</option>
                        </select>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
