"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useActivities } from "@/hooks/useActivities";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ShareActivityModal from "@/components/dashboard/ShareActivityModal";
import CommentsSection from "@/components/dashboard/activity/CommentsSection";
import ActivityStatsGrid from "@/components/dashboard/activity/ActivityStatsGrid";
import PaceAnalysisChart from "@/components/dashboard/activity/PaceAnalysisChart";
import SplitsTable from "@/components/dashboard/activity/SplitsTable";
import MatchedRunsSection from "@/components/dashboard/activity/MatchedRunsSection";
import ActivityMap from "@/components/dashboard/activity/ActivityMap";
import { Share2 } from "lucide-react";

const MOVABLE_ACTIVITY_TYPES = ["Run", "Walk", "Hike", "Bike"];

export default function ActivityDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { settings } = useSettings();

    const { activities, loading, updateActivity, deleteActivity } = useActivities();
    const [activeTab, setActiveTab] = useState<"overview" | "splits" | "analysis">("overview");
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [showActions, setShowActions] = useState(false);

    // Edit state
    const [editDistance, setEditDistance] = useState("");
    const [editDurationHr, setEditDurationHr] = useState("");
    const [editDurationMin, setEditDurationMin] = useState("");
    const [editDurationSec, setEditDurationSec] = useState("");
    const [editCalories, setEditCalories] = useState("");
    const [editNotes, setEditNotes] = useState("");
    const [editType, setEditType] = useState<"Run" | "Walk" | "Bike" | "Hike" | "HIIT" | "Fasting" | "Meditation" | "Journal" | "Daily Steps" | "Weight Training" | "Yoga" | "Aerobics">("Run");
    const [editStartTime, setEditStartTime] = useState("");
    const [editEndTime, setEditEndTime] = useState("");
    const [editDate, setEditDate] = useState("");


    const activity = activities.find(a => a.id === id);

    useEffect(() => {
        if (activity && editing) {
            setEditDistance(String(activity.distance));
            const durSec = activity.duration || 0;
            setEditDurationHr(String(Math.floor(durSec / 3600)));
            setEditDurationMin(String(Math.floor((durSec % 3600) / 60)));
            setEditDurationSec(String(Math.floor(durSec % 60)));
            setEditCalories(String(activity.calories || 0));
            setEditNotes(activity.notes || "");
            setEditType(activity.type);
            const fmt = (d: any) => {
                if (!d) return "";
                const dateObj = new Date(d);
                if (isNaN(dateObj.getTime())) return "";
                return dateObj.toISOString().slice(0, 16);
            };
            setEditStartTime(fmt(activity.startTime || activity.date));
            setEditEndTime(activity.endTime ? fmt(activity.endTime) : "");
            const mainDate = new Date(activity.date);
            setEditDate(!isNaN(mainDate.getTime()) ? mainDate.toISOString().split('T')[0] : "");
        }
    }, [activity, editing]);

    const handleSave = async () => {
        if (!activity) return;
        setSaving(true);
        try {
            let durationSeconds = (parseInt(editDurationHr) || 0) * 3600 + (parseInt(editDurationMin) || 0) * 60 + (parseInt(editDurationSec) || 0);
            if (editStartTime && editEndTime) {
                const start = new Date(editStartTime);
                const end = new Date(editEndTime);
                durationSeconds = Math.max(0, (end.getTime() - start.getTime()) / 1000);
            }
            await updateActivity(activity.id, {
                distance: parseFloat(editDistance) || activity.distance,
                duration: durationSeconds,
                calories: parseInt(editCalories) || activity.calories,
                notes: editNotes,
                type: editType,
                startTime: editStartTime ? new Date(editStartTime) : undefined,
                endTime: editEndTime ? new Date(editEndTime) : undefined,
                date: new Date(editDate),
            } as any);
            setEditing(false);
        } catch (e: any) {
            alert("Failed to save: " + (e.message || "Unknown error"));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!activity) return;
        setDeleting(true);
        try {
            await deleteActivity(activity.id);
            router.push("/dashboard/activities");
        } catch (e: any) {
            alert("Failed to delete: " + (e.message || "Unknown error"));
            setDeleting(false);
        }
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !activity) return;
        setUploadingMedia(true);
        try {
            const { storage } = await import("@/lib/firebase/config");
            const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
            const type = (file.type.startsWith("video") ? "video" : "image") as "image" | "video";
            const path = `users/${user.uid}/activities/${activity.id}/media/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, path);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            const newMedia = { type, url, path, createdAt: new Date().toISOString() };
            const updatedMedia = [...(activity.media || []), newMedia];
            await updateActivity(activity.id, { media: updatedMedia });
        } catch (error) {
            console.error("Media upload failed", error);
            alert("Failed to upload media.");
        } finally {
            setUploadingMedia(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "16px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--primary)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <span style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>Loading activity...</span>
                </div>
            </DashboardLayout>
        );
    }

    if (!activity) {
        return (
            <DashboardLayout>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "16px" }}>
                    <div style={{ fontSize: "48px" }}>🏃</div>
                    <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Activity not found</h2>
                    <Link href="/dashboard/activities" style={{ color: "var(--primary)", fontWeight: 600 }}>← Back to Activities</Link>
                </div>
            </DashboardLayout>
        );
    }

    const isMovable = MOVABLE_ACTIVITY_TYPES.includes(activity.type);
    const hasMapData = activity.path && activity.path.length > 0;
    const center = hasMapData ? activity.path![0] : [41.4737, -74.0232] as [number, number];

    const modeIcon = activity.mode === "run" ? "🏃" :
        activity.mode === "walk" ? "🚶" :
        activity.mode === "hike" ? "🥾" :
        activity.mode === "bike" ? "🚴" :
        activity.mode === "meditation" ? "🧘" : "⏱️";

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "10px", borderRadius: "var(--radius-sm)",
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
        color: "#fff", outline: "none", fontSize: "14px",
    };

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "600px", margin: "0 auto", paddingBottom: "60px" }}>

            {/* ── TOP NAVIGATION BAR ── */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", position: "sticky", top: 0, zIndex: 100,
                background: "var(--background)", borderBottom: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(10px)",
            }}>
                <button onClick={() => router.back()} style={{
                    background: "none", border: "none", color: "var(--primary)", cursor: "pointer",
                    fontSize: "15px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", padding: 0,
                }}>
                    ‹ {activity.type}
                </button>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button onClick={() => setShowShareModal(true)} style={{
                        background: "none", border: "none", color: "var(--foreground-muted)", cursor: "pointer", padding: "6px",
                    }}>
                        <Share2 size={20} />
                    </button>
                    <div style={{ position: "relative" }}>
                        <button onClick={() => setShowActions(!showActions)} style={{
                            background: "none", border: "none", color: "var(--foreground-muted)", cursor: "pointer",
                            fontSize: "22px", padding: "4px 8px", lineHeight: 1,
                        }}>
                            •••
                        </button>
                        {showActions && (
                            <div style={{
                                position: "absolute", top: "100%", right: 0, background: "var(--surface)",
                                border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px",
                                overflow: "hidden", minWidth: "160px", zIndex: 200,
                                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                            }}>
                                {[
                                    { label: "✏️ Edit Activity", action: () => { setEditing(true); setShowActions(false); } },
                                    { label: "📷 Add Photo", action: () => { (document.getElementById("media-upload") as HTMLInputElement)?.click(); setShowActions(false); } },
                                    { label: !confirmDelete ? "🗑 Delete" : "⚠️ Confirm Delete", action: () => !confirmDelete ? setConfirmDelete(true) : handleDelete(), danger: true },
                                ].map((item, i) => (
                                    <button key={i} onClick={item.action} style={{
                                        display: "block", width: "100%", padding: "14px 18px",
                                        background: "none", border: "none", textAlign: "left",
                                        color: (item as any).danger ? "#ff4444" : "var(--foreground)",
                                        cursor: "pointer", fontSize: "14px", fontWeight: 500,
                                        borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
                                    }}>
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <input id="media-upload" type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleMediaUpload} />

            {/* ── ACTIVITY HERO HEADER ── */}
            <div style={{ padding: "20px 20px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {user?.photoURL
                            ? <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <span style={{ fontSize: "18px", fontWeight: 700 }}>{user?.displayName?.[0] || "U"}</span>}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: "15px" }}>{user?.displayName || "You"}</div>
                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                            {activity.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                            {" · "}
                            {activity.date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            {activity.environment && ` · ${activity.environment}`}
                        </div>
                    </div>
                </div>

                <h1 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "4px" }}>
                    {activity.title || `${modeIcon} ${activity.type}`}
                </h1>
                {(activity.notes) && (
                    <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.5, marginBottom: 0 }}>
                        {activity.notes}
                    </p>
                )}
            </div>

            {/* ── MAP ── */}
            {isMovable && settings.showMap && (
                <div style={{ marginTop: "16px" }}>
                    <ActivityMap
                        center={center}
                        zoom={hasMapData ? 14 : 12}
                        path={hasMapData ? activity.path : undefined}
                    />
                </div>
            )}

            {/* ── EDIT MODE ── */}
            {editing && (
                <div style={{ margin: "20px", padding: "24px", background: "var(--surface)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>Edit Activity</h3>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--foreground-muted)" }}>Type</label>
                            <select value={editType} onChange={(e) => setEditType(e.target.value as any)} style={inputStyle}>
                                {["Run","Walk","Bike","Hike","HIIT","Fasting","Meditation"].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--foreground-muted)" }}>Distance (mi)</label>
                            <input type="number" step="0.01" value={editDistance} onChange={(e) => setEditDistance(e.target.value)} style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--foreground-muted)" }}>Start Time</label>
                            <input type="datetime-local" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--foreground-muted)" }}>End Time</label>
                            <input type="datetime-local" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                        {[["Hours", editDurationHr, setEditDurationHr], ["Minutes", editDurationMin, setEditDurationMin], ["Seconds", editDurationSec, setEditDurationSec]].map(([label, val, setter]: any) => (
                            <div key={label}>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--foreground-muted)" }}>{label}</label>
                                <input type="number" value={val} onChange={(e) => setter(e.target.value)} style={inputStyle} placeholder="0" />
                            </div>
                        ))}
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "var(--foreground-muted)" }}>Notes</label>
                        <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize: "none" }} />
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                        <button onClick={handleSave} disabled={saving} style={{
                            flex: 1, padding: "14px", background: "var(--primary)", color: "#000",
                            border: "none", borderRadius: "30px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                            opacity: saving ? 0.6 : 1, fontSize: "15px",
                        }}>
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button onClick={() => setEditing(false)} style={{
                            padding: "14px 20px", background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)", color: "var(--foreground)",
                            borderRadius: "30px", cursor: "pointer", fontSize: "15px",
                        }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ── STATS GRID ── */}
            {!editing && (
                <>
                    <ActivityStatsGrid activity={activity} />

                    {/* ── TAB BAR ── */}
                    {isMovable && (
                        <div style={{
                            display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)",
                            padding: "0 20px", gap: "4px",
                        }}>
                            {[
                                { key: "overview", label: "Overview" },
                                { key: "splits", label: "Splits" },
                                { key: "analysis", label: "Analysis" },
                            ].map(tab => (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
                                    padding: "12px 16px", background: "none", border: "none",
                                    color: activeTab === tab.key ? "var(--foreground)" : "var(--foreground-muted)",
                                    fontWeight: activeTab === tab.key ? 700 : 500,
                                    borderBottom: activeTab === tab.key ? "2px solid var(--primary)" : "2px solid transparent",
                                    cursor: "pointer", fontSize: "14px", marginBottom: "-1px",
                                    transition: "all 0.2s",
                                }}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ── OVERVIEW TAB ── */}
                    {(!isMovable || activeTab === "overview") && (
                        <>
                            {/* Weather */}
                            {activity.weatherSnapshot && (
                                <div style={{ margin: "20px", padding: "16px", background: "var(--surface)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                                    <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "14px", color: "var(--foreground-muted)", textTransform: "uppercase" }}>Weather</h3>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", textAlign: "center" }}>
                                        {[
                                            { lbl: "Temp", val: `${activity.weatherSnapshot.temp}°F` },
                                            { lbl: "Condition", val: activity.weatherSnapshot.condition },
                                            { lbl: "Humidity", val: `${activity.weatherSnapshot.humidity}%` },
                                            { lbl: "Wind", val: `${activity.weatherSnapshot.wind} mph` },
                                        ].map(w => (
                                            <div key={w.lbl}>
                                                <div style={{ fontSize: "10px", color: "var(--foreground-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{w.lbl}</div>
                                                <div style={{ fontWeight: 600, fontSize: "13px" }}>{w.val}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AI Analysis */}
                            {activity.aiAnalysis && (
                                <div style={{ margin: "20px", padding: "20px", background: "linear-gradient(135deg, rgba(0,229,255,0.05), rgba(0,229,255,0.1))", borderRadius: "16px", border: "1px solid rgba(0,229,255,0.2)" }}>
                                    <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "2px solid var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, color: "var(--primary)" }}>
                                            {activity.aiAnalysis.score}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "11px", color: "#00e5ff", fontWeight: 700, marginBottom: "2px" }}>AI COACH FEEDBACK</div>
                                            <div style={{ fontSize: "13px", color: "var(--foreground)", lineHeight: 1.4 }}>{activity.aiAnalysis.feedback}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: "grid", gap: "8px" }}>
                                        {activity.aiAnalysis.insights.map((insight, idx) => (
                                            <div key={idx} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                                                <span style={{ color: "var(--primary)" }}>✦</span>
                                                {insight}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Matched Runs + Best Efforts */}
                            {isMovable && <MatchedRunsSection activity={activity} />}

                            {/* Media Gallery */}
                            <div style={{ margin: "20px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                                    <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Photos & Videos</h3>
                                    <label style={{
                                        display: "flex", alignItems: "center", gap: "6px", cursor: "pointer",
                                        fontSize: "13px", color: "var(--primary)", fontWeight: 600,
                                    }}>
                                        {uploadingMedia ? "Uploading…" : "+ Add Media"}
                                        <input type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleMediaUpload} disabled={uploadingMedia} />
                                    </label>
                                </div>

                                {activity.media && activity.media.length > 0 ? (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px", borderRadius: "12px", overflow: "hidden" }}>
                                        {activity.media.map((item: any, i: number) => (
                                            <div key={i} style={{ aspectRatio: "1/1", background: "#000", position: "relative" }}>
                                                {item.type === "video"
                                                    ? <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    : <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: "32px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                                        <div style={{ fontSize: "32px", marginBottom: "8px" }}>📷</div>
                                        <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>No photos or videos yet</div>
                                    </div>
                                )}
                            </div>

                            {/* Comments */}
                            <div style={{ margin: "20px" }}>
                                <CommentsSection activityId={activity.id} ownerId={user?.uid || ""} />
                            </div>
                        </>
                    )}

                    {/* ── SPLITS TAB ── */}
                    {isMovable && activeTab === "splits" && (
                        <SplitsTable activity={activity} />
                    )}

                    {/* ── ANALYSIS TAB ── */}
                    {isMovable && activeTab === "analysis" && (
                        <PaceAnalysisChart activity={activity} />
                    )}
                </>
            )}

            {/* ── SHARE MODAL ── */}
            {showShareModal && (
                <ShareActivityModal activity={activity} onClose={() => setShowShareModal(false)} />
            )}

            {/* ── OVERLAY backdrop for action menu ── */}
            {showActions && (
                <div onClick={() => setShowActions(false)} style={{
                    position: "fixed", inset: 0, zIndex: 99,
                }} />
            )}
            </div>
        </DashboardLayout>
    );
}
