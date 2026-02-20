"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useState } from "react";
import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { t, LANGUAGE_OPTIONS, isRTL, Language } from "@/lib/translations";

export default function SettingsPage() {
    const { user } = useAuth();
    const { settings, updateSettings, toggleTheme } = useSettings();
    const [uploading, setUploading] = useState(false);
    const lang = settings.language || "en";

    const handleTestVoice = () => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            const u = new SpeechSynthesisUtterance(t(lang, "voiceCheck"));
            window.speechSynthesis.speak(u);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        if (file.size > 2 * 1024 * 1024) { alert(t(lang, "photoTooLarge")); return; }
        setUploading(true);
        try {
            const storageRef = ref(storage, `profile_photos/${user.uid}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            await updateProfile(user, { photoURL: downloadURL });
            alert(t(lang, "photoUpdated"));
        } catch (error) {
            console.error("Error uploading photo:", error);
            alert(t(lang, "photoUploadFailed"));
        } finally {
            setUploading(false);
        }
    };

    // ... (styles)

    // ...

    return (
        <DashboardLayout>
            {/* ... */}
            <div>
                <label className="btn-primary" style={{ cursor: "pointer", display: "inline-block" }}>
                    {uploading ? t(lang, "loading") : t(lang, "changePhoto")}
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} disabled={uploading} />
                </label>
                <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "5px" }}>{t(lang, "recommendedPhoto")}</div>
            </div>
        </div>

                    {/* ... */ }

    {/* Voice Coaching Toggle */ }
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
            <span>{t(lang, "voiceCoaching")}</span>
            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{t(lang, "voiceCoachingDesc")}</div>
        </div>
        <button onClick={() => updateSettings({ voiceCoaching: !settings.voiceCoaching })} style={toggleStyle(settings.voiceCoaching)}>
            <div style={toggleKnob(settings.voiceCoaching)} />
        </button>
    </div>

    {
        settings.voiceCoaching && (
            <div style={{ marginBottom: "20px", marginTop: "-10px" }}>
                <button onClick={handleTestVoice} style={{ fontSize: "12px", color: "var(--primary)", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                    🔊 {t(lang, "testVoice")}
                </button>
            </div>
        )
    }

    {/* ... */ }

    {/* Auto-Pause Toggle */ }
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: settings.autoPause ? "20px" : "0" }}>
        <div>
            <span>{t(lang, "autoPause")}</span>
            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{t(lang, "autoPauseDesc")}</div>
        </div>
        <button onClick={() => updateSettings({ autoPause: !settings.autoPause })} style={toggleStyle(settings.autoPause)}>
            <div style={toggleKnob(settings.autoPause)} />
        </button>
    </div>

    {/* Auto-Pause Sensitivity — only if auto-pause is on */ }
    {
        settings.autoPause && (
            <div>
                <label style={{ display: "block", marginBottom: "10px", color: "var(--foreground-muted)", fontSize: "14px" }}>{t(lang, "autoPauseSensitivity")}</label>
                <div style={{ display: "flex", gap: "8px" }}>
                    {(["low", "medium", "high"] as const).map((s) => (
                        <button key={s} onClick={() => updateSettings({ autoPauseSensitivity: s })} style={segmentStyle(settings.autoPauseSensitivity === s)}>
                            {t(lang, s)}
                        </button>
                    ))}
                </div>
            </div>
        )
    }
                </div >

        {/* General Preferences — existing */ }
        < div className = "glass-panel" style = {{ padding: "20px", borderRadius: "16px", marginBottom: "20px" }
}>
                    <h3 style={{ marginBottom: "15px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>{t(lang, "preferences")}</h3>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <span>{t(lang, "themeMode")}</span>
                        <button onClick={toggleTheme} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.2)", padding: "8px 16px", borderRadius: "20px", color: "var(--foreground)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: settings.theme === "light" ? "#FFCC00" : "#CCFF00" }} />
                            {settings.theme === "light" ? t(lang, "lightMode") : t(lang, "darkMode")}
                        </button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>{t(lang, "units")}</span>
                        <select value={settings.units} onChange={(e) => updateSettings({ units: e.target.value as "imperial" | "metric" })} style={{ background: "rgba(0,0,0,0.3)", color: "var(--foreground)", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", outline: "none" }}>
                            <option value="imperial">{t(lang, "imperial")}</option>
                            <option value="metric">{t(lang, "metric")}</option>
                        </select>
                    </div>

{/* Language */ }
<div style={{ marginTop: "20px" }}>
    <label style={{ display: "block", marginBottom: "10px", color: "var(--foreground-muted)", fontSize: "14px" }}>{t(lang, "language")}</label>
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {LANGUAGE_OPTIONS.map((opt) => (
            <button
                key={opt.id}
                onClick={() => updateSettings({ language: opt.id })}
                style={{
                    ...segmentStyle(settings.language === opt.id),
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                }}
            >
                <span>{opt.flag}</span>
                <span>{opt.nativeLabel}</span>
            </button>
        ))}
    </div>
    <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "6px" }}>{t(lang, "languageDesc")}</div>
</div>
                </div >

    {/* Support */ }
    < div className = "glass-panel" style = {{ padding: "20px", borderRadius: "16px" }}>
                    <h3 style={{ marginBottom: "15px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>{t(lang, "support")}</h3>
                    <a href="/help/install" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "var(--foreground)" }}>
                        <span>📱 {t(lang, "installApp")}</span>
                        <span style={{ color: "var(--foreground-muted)" }}>→</span>
                    </a>
                </div >
            </div >
        </DashboardLayout >
    );
}
