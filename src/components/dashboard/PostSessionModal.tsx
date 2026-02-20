"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { t } from "@/lib/translations";

export interface SessionData {
    mode: string;
    distanceMiles: number;
    durationSeconds: number;
    calories: number;
    steps: number;
}

export interface SaveData {
    title: string;
    notes: string;
    mediaFiles: File[];
    isPublic: boolean;
}

interface Props {
    session: SessionData;
    onSave: (data: SaveData) => Promise<void> | void;
    onDiscard: () => void;
}

export default function PostSessionModal({ session, onSave, onDiscard }: Props) {
    const { user } = useAuth();
    const { settings } = useSettings();
    const lang = settings.language;
    const [title, setTitle] = useState(() => {
        const hour = new Date().getHours();
        let timeOfDay = "Morning";
        if (hour >= 12 && hour < 17) timeOfDay = "Afternoon";
        if (hour >= 17 && hour < 21) timeOfDay = "Evening";
        if (hour >= 21) timeOfDay = "Night";

        // Note: Simple localization for time of day would be better, but for now we keep it English or basic
        // Ideally: t(lang, timeOfDay.toLowerCase())
        // For mode:
        const label = t(lang, session.mode.toLowerCase() as any) || session.mode;
        return `${timeOfDay} ${label}`;
    });
    const [notes, setNotes] = useState("");
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
    const [isPublic, setIsPublic] = useState(true);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}h ${m}m ${s}s`;
        return `${m}m ${s}s`;
    };

    const getPace = () => {
        if (session.distanceMiles === 0) return "--";
        if (session.mode === "bike") {
            const hours = session.durationSeconds / 3600;
            return `${(session.distanceMiles / hours).toFixed(1)} mph`;
        }
        const paceSecondsPerMile = session.durationSeconds / session.distanceMiles;
        const pMin = Math.floor(paceSecondsPerMile / 60);
        const pSec = Math.floor(paceSecondsPerMile % 60);
        return `${pMin}'${pSec < 10 ? '0' : ''}${pSec}"/mi`;
    };

    const handleAddMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setMediaFiles(prev => [...prev, ...files]);
        files.forEach(file => {
            const url = URL.createObjectURL(file);
            setMediaPreviews(prev => [...prev, url]);
        });
    };

    const handleRemoveMedia = (idx: number) => {
        URL.revokeObjectURL(mediaPreviews[idx]);
        setMediaFiles(prev => prev.filter((_, i) => i !== idx));
        setMediaPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({ notes, title, mediaFiles, isPublic });
        } catch (e) {
            console.error("Save failed:", e);
            alert("Failed to save session.");
        } finally {
            setSaving(false);
        }
    };

    const modeIcon = session.mode === "run" ? "🏃" : session.mode === "walk" ? "🚶" : session.mode === "hike" ? "🥾" : "🚴";

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.3s ease",
        }}>
            <div style={{
                background: "var(--surface, #111)",
                borderRadius: "var(--radius-lg, 16px)",
                border: "1px solid rgba(255,255,255,0.08)",
                maxWidth: "520px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "0",
            }}>
                {/* Header */}
                <div style={{
                    padding: "24px 24px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    textAlign: "center",
                }}>
                    <div style={{ fontSize: "48px", marginBottom: "8px" }}>{modeIcon}</div>
                    <div style={{ fontSize: "14px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "4px" }}>
                        {t(lang, "sessionComplete")}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--primary)" }}>
                        {new Date().toLocaleDateString(lang === 'en' ? 'en-US' : lang, { weekday: "long", month: "short", day: "numeric" })}
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "1px",
                    background: "rgba(255,255,255,0.04)",
                    margin: "0",
                }}>
                    {[
                        { label: t(lang, "distance"), value: `${session.distanceMiles.toFixed(2)}`, unit: settings.units === "imperial" ? "mi" : "km" },
                        { label: t(lang, "time"), value: formatTime(session.durationSeconds), unit: "" },
                        { label: session.mode === "bike" ? t(lang, "speed") : t(lang, "pace"), value: getPace(), unit: "" },
                        { label: t(lang, "calories"), value: `${session.calories}`, unit: "kcal" },
                        { label: t(lang, "steps"), value: session.steps.toLocaleString(), unit: "" },
                        { label: "Elevation", value: "--", unit: "ft" }, // todo: localize elevation
                    ].map((stat, i) => (
                        <div key={i} style={{
                            textAlign: "center",
                            padding: "16px 8px",
                            background: "var(--surface, #111)",
                        }}>
                            <div style={{ fontSize: "11px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>{stat.label}</div>
                            <div style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-heading)" }}>
                                {stat.value}
                                {stat.unit && <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--foreground-muted)", marginLeft: "3px" }}>{stat.unit}</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Title + Notes */}
                <div style={{ padding: "20px 24px" }}>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder={t(lang, "nameYourActivity")}
                        style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "var(--radius-sm, 8px)",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#fff",
                            fontSize: "18px",
                            fontWeight: 600,
                            outline: "none",
                            marginBottom: "12px",
                        }}
                    />
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder={t(lang, "howDidItFeel")}
                        rows={3}
                        style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "var(--radius-sm, 8px)",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#fff",
                            fontSize: "14px",
                            outline: "none",
                            resize: "none",
                            lineHeight: "1.5",
                        }}
                    />
                </div>

                {/* Media Upload */}
                <div style={{ padding: "0 24px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "10px 16px",
                                borderRadius: "var(--radius-full, 24px)",
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: 500,
                            }}
                        >
                            📷 {t(lang, "addPhotosVideos")}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            capture="environment"
                            multiple
                            onChange={handleAddMedia}
                            style={{ display: "none" }}
                        />
                    </div>

                    {mediaPreviews.length > 0 && (
                        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px" }}>
                            {mediaPreviews.map((url, i) => (
                                <div key={i} style={{
                                    position: "relative",
                                    width: "80px",
                                    height: "80px",
                                    borderRadius: "10px",
                                    overflow: "hidden",
                                    flexShrink: 0,
                                    background: "#000",
                                }}>
                                    {mediaFiles[i]?.type.startsWith("video") ? (
                                        <video src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    )}
                                    <button
                                        onClick={() => handleRemoveMedia(i)}
                                        style={{
                                            position: "absolute",
                                            top: "4px",
                                            right: "4px",
                                            width: "20px",
                                            height: "20px",
                                            borderRadius: "50%",
                                            background: "rgba(0,0,0,0.7)",
                                            color: "#fff",
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: "12px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Share Toggle */}
                <div style={{
                    padding: "0 24px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}>
                    <div>
                        <div style={{ fontSize: "14px", fontWeight: 600 }}>{t(lang, "shareToFeed")}</div>
                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                            {isPublic ? t(lang, "visibleToAll") : t(lang, "onlyYou")}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsPublic(!isPublic)}
                        style={{
                            width: "48px",
                            height: "28px",
                            borderRadius: "14px",
                            background: isPublic ? "var(--primary)" : "rgba(255,255,255,0.1)",
                            border: "none",
                            cursor: "pointer",
                            position: "relative",
                            transition: "background 0.2s",
                        }}
                    >
                        <div style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            background: "#fff",
                            position: "absolute",
                            top: "3px",
                            left: isPublic ? "23px" : "3px",
                            transition: "left 0.2s",
                        }} />
                    </button>
                </div>

                {/* Actions */}
                <div style={{
                    padding: "16px 24px 24px",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    gap: "12px",
                }}>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary"
                        style={{
                            flex: 1,
                            padding: "14px",
                            fontSize: "16px",
                            fontWeight: 700,
                            borderRadius: "var(--radius-full, 24px)",
                            justifyContent: "center",
                            opacity: saving ? 0.6 : 1,
                            cursor: saving ? "not-allowed" : "pointer",
                        }}
                    >
                        {saving ? t(lang, "sessionSaving") : t(lang, "saveActivity")}
                    </button>
                    <button
                        onClick={onDiscard}
                        disabled={saving}
                        style={{
                            padding: "14px 20px",
                            fontSize: "14px",
                            borderRadius: "var(--radius-full, 24px)",
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "var(--foreground-muted)",
                            cursor: saving ? "not-allowed" : "pointer",
                        }}
                    >
                        {t(lang, "discard")}
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
