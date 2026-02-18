"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useState } from "react";
import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";

export default function SettingsPage() {
    const { user } = useAuth();
    const { settings, updateSettings, toggleTheme } = useSettings();
    const [uploading, setUploading] = useState(false);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        if (file.size > 2 * 1024 * 1024) { alert("File is too large. Max 2MB."); return; }
        setUploading(true);
        try {
            const storageRef = ref(storage, `profile_photos/${user.uid}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            await updateProfile(user, { photoURL: downloadURL });
            alert("Profile photo updated!");
        } catch (error) {
            console.error("Error uploading photo:", error);
            alert("Failed to upload photo.");
        } finally {
            setUploading(false);
        }
    };

    const segmentStyle = (active: boolean) => ({
        padding: "8px 16px",
        borderRadius: "var(--radius-full)",
        border: "1px solid " + (active ? "var(--primary)" : "rgba(255,255,255,0.15)"),
        background: active ? "rgba(204, 255, 0, 0.15)" : "transparent",
        color: active ? "var(--primary)" : "var(--foreground-muted)",
        cursor: "pointer" as const,
        fontWeight: active ? 600 : 400,
        fontSize: "14px",
        transition: "var(--transition-fast)",
    });

    const toggleStyle = (active: boolean) => ({
        width: "48px",
        height: "26px",
        borderRadius: "13px",
        background: active ? "var(--primary)" : "rgba(255,255,255,0.15)",
        border: "none",
        cursor: "pointer" as const,
        position: "relative" as const,
        transition: "var(--transition-fast)",
    });

    const toggleKnob = (active: boolean) => ({
        position: "absolute" as const,
        top: "3px",
        left: active ? "24px" : "3px",
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        background: active ? "#000" : "var(--foreground-muted)",
        transition: "var(--transition-fast)",
    });

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                <h1 style={{ marginBottom: "30px" }}>Settings</h1>

                {/* Profile Section */}
                <div className="glass-panel" style={{ padding: "20px", borderRadius: "16px", marginBottom: "20px" }}>
                    <h3 style={{ marginBottom: "15px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>Profile</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
                        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--surface)", border: "2px solid var(--primary)", backgroundImage: user?.photoURL ? `url(${user.photoURL})` : "none", backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {!user?.photoURL && <span style={{ fontSize: "30px" }}>👤</span>}
                        </div>
                        <div>
                            <label className="btn-primary" style={{ cursor: "pointer", display: "inline-block" }}>
                                {uploading ? "Uploading..." : "Change Photo"}
                                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} disabled={uploading} />
                            </label>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "5px" }}>Recommended: Square JPG/PNG, max 2MB</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px", color: "var(--foreground-muted)" }}>Display Name</label>
                            <input type="text" value={user?.displayName || ""} className="input-field" disabled style={{ color: "var(--foreground)" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "5px", color: "var(--foreground-muted)" }}>Email</label>
                            <input type="email" value={user?.email || ""} className="input-field" disabled style={{ color: "var(--foreground)" }} />
                        </div>
                    </div>
                </div>

                {/* Session Preferences — NEW */}
                <div className="glass-panel" style={{ padding: "20px", borderRadius: "16px", marginBottom: "20px" }}>
                    <h3 style={{ marginBottom: "15px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>Session Preferences</h3>

                    {/* Activity Mode */}
                    <div style={{ marginBottom: "24px" }}>
                        <label style={{ display: "block", marginBottom: "10px", color: "var(--foreground-muted)", fontSize: "14px" }}>Activity Mode</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                            {(["run", "walk", "bike"] as const).map((m) => (
                                <button key={m} onClick={() => updateSettings({ activityMode: m })} style={segmentStyle(settings.activityMode === m)}>
                                    {m === "run" ? "🏃 Run" : m === "walk" ? "🚶 Walk" : "🚴 Bike"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Environment */}
                    <div style={{ marginBottom: "24px" }}>
                        <label style={{ display: "block", marginBottom: "10px", color: "var(--foreground-muted)", fontSize: "14px" }}>Environment</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                            {(["outdoor", "indoor"] as const).map((env) => (
                                <button key={env} onClick={() => updateSettings({ environment: env })} style={segmentStyle(settings.environment === env)}>
                                    {env === "outdoor" ? "🌍 Outdoor" : "🏠 Indoor"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Voice Coaching Toggle */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div>
                            <span>Voice Coaching</span>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>AI announcements at mile splits</div>
                        </div>
                        <button onClick={() => updateSettings({ voiceCoaching: !settings.voiceCoaching })} style={toggleStyle(settings.voiceCoaching)}>
                            <div style={toggleKnob(settings.voiceCoaching)} />
                        </button>
                    </div>

                    {/* Weather Announcements Toggle — only for outdoor */}
                    {settings.environment === "outdoor" && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div>
                                <span>Weather Announcements</span>
                                <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>Weather update at session start</div>
                            </div>
                            <button onClick={() => updateSettings({ weatherAnnouncements: !settings.weatherAnnouncements })} style={toggleStyle(settings.weatherAnnouncements)}>
                                <div style={toggleKnob(settings.weatherAnnouncements)} />
                            </button>
                        </div>
                    )}

                    {/* Auto-Pause Toggle */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: settings.autoPause ? "20px" : "0" }}>
                        <div>
                            <span>Auto-Pause</span>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>Automatically pause when stopped</div>
                        </div>
                        <button onClick={() => updateSettings({ autoPause: !settings.autoPause })} style={toggleStyle(settings.autoPause)}>
                            <div style={toggleKnob(settings.autoPause)} />
                        </button>
                    </div>

                    {/* Auto-Pause Sensitivity — only if auto-pause is on */}
                    {settings.autoPause && (
                        <div>
                            <label style={{ display: "block", marginBottom: "10px", color: "var(--foreground-muted)", fontSize: "14px" }}>Auto-Pause Sensitivity</label>
                            <div style={{ display: "flex", gap: "8px" }}>
                                {(["low", "medium", "high"] as const).map((s) => (
                                    <button key={s} onClick={() => updateSettings({ autoPauseSensitivity: s })} style={segmentStyle(settings.autoPauseSensitivity === s)}>
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* General Preferences — existing */}
                <div className="glass-panel" style={{ padding: "20px", borderRadius: "16px", marginBottom: "20px" }}>
                    <h3 style={{ marginBottom: "15px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>Preferences</h3>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <span>Theme Mode</span>
                        <button onClick={toggleTheme} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.2)", padding: "8px 16px", borderRadius: "20px", color: "var(--foreground)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: settings.theme === "light" ? "#FFCC00" : "#CCFF00" }} />
                            {settings.theme === "light" ? "Light Mode" : "Dark Mode"}
                        </button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>Units</span>
                        <select value={settings.units} onChange={(e) => updateSettings({ units: e.target.value as "imperial" | "metric" })} style={{ background: "rgba(0,0,0,0.3)", color: "var(--foreground)", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", outline: "none" }}>
                            <option value="imperial">Imperial (mi)</option>
                            <option value="metric">Metric (km)</option>
                        </select>
                    </div>
                </div>

                {/* Support */}
                <div className="glass-panel" style={{ padding: "20px", borderRadius: "16px" }}>
                    <h3 style={{ marginBottom: "15px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>Support</h3>
                    <a href="/help/install" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "var(--foreground)" }}>
                        <span>📱 Install App (PWA)</span>
                        <span style={{ color: "var(--foreground-muted)" }}>→</span>
                    </a>
                </div>
            </div>
        </DashboardLayout>
    );
}
