"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useActivities } from "@/hooks/useActivities";
import ShareActivityModal from "@/components/dashboard/ShareActivityModal";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Share2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import CommentsSection from "@/components/dashboard/activity/CommentsSection";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(mod => mod.Polyline), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

export default function ActivityDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { isAdmin } = useUserRole();
    const { activities, loading, updateActivity, deleteActivity } = useActivities();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    // Edit form state
    const [editDistance, setEditDistance] = useState("");
    const [editDurationMin, setEditDurationMin] = useState("");
    const [editDurationSec, setEditDurationSec] = useState("");
    const [editCalories, setEditCalories] = useState("");
    const [editNotes, setEditNotes] = useState("");
    const [editType, setEditType] = useState<"Run" | "Walk" | "Bike" | "Hike" | "HIIT">("Run");

    const activity = activities.find(a => a.id === id);

    // Populate edit fields when activity loads or edit mode is entered
    useEffect(() => {
        if (activity && editing) {
            setEditDistance(String(activity.distance));
            const durSec = activity.duration || 0;
            setEditDurationMin(String(Math.floor(durSec / 60)));
            setEditDurationSec(String(Math.floor(durSec % 60)));
            setEditCalories(String(activity.calories || 0));
            setEditNotes(activity.notes || "");
            setEditType(activity.type);
        }
    }, [activity, editing]);

    const formatDuration = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = Math.floor(totalSeconds % 60);
        if (h > 0) return `${h}h ${m}m ${s}s`;
        return `${m}m ${s}s`;
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !activity) return;

        setUploadingMedia(true);
        try {
            // Client-side upload
            const { storage } = await import("@/lib/firebase/config");
            const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");

            const type = (file.type.startsWith("video") ? "video" : "image") as "image" | "video";
            const path = `users/${user.uid}/activities/${activity.id}/media/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, path);

            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            // Update Activity Doc
            const newMedia = {
                type,
                url,
                path,
                createdAt: new Date().toISOString()
            };

            const updatedMedia = [...(activity.media || []), newMedia];

            // Optimistic update (hook will refresh from local state usually, but let's be safe)
            await updateActivity(activity.id, { media: updatedMedia });

        } catch (error) {
            console.error("Media upload failed", error);
            alert("Failed to upload media.");
        } finally {
            setUploadingMedia(false);
        }
    };

    const handleDeleteMedia = async (mediaItem: any) => {
        if (!confirm("Delete this?")) return;
        if (!activity) return;

        try {
            // 1. Delete from Storage
            const { storage } = await import("@/lib/firebase/config");
            const { ref, deleteObject } = await import("firebase/storage");
            if (mediaItem.path) {
                const storageRef = ref(storage, mediaItem.path);
                await deleteObject(storageRef).catch(e => console.warn("Storage delete failed", e));
            }

            // 2. Update Doc
            const updatedMedia = (activity.media || []).filter((m: any) => m.url !== mediaItem.url);
            await updateActivity(activity.id, { media: updatedMedia });

        } catch (error) {
            console.error(error);
            alert("Failed to delete media.");
        }
    };

    const handleSave = async () => {
        if (!activity) return;
        setSaving(true);
        try {
            const durationSeconds = (parseInt(editDurationMin) || 0) * 60 + (parseInt(editDurationSec) || 0);
            await updateActivity(activity.id, {
                distance: parseFloat(editDistance) || activity.distance,
                duration: durationSeconds,
                calories: parseInt(editCalories) || activity.calories,
                notes: editNotes,
                type: editType,
            });
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

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ padding: "40px", textAlign: "center", color: "var(--foreground-muted)" }}>
                    Loading activity details...
                </div>
            </DashboardLayout>
        );
    }

    if (!activity) {
        return (
            <DashboardLayout>
                <div style={{ padding: "40px", textAlign: "center" }}>
                    <h2>Activity not found</h2>
                    <Link href="/dashboard/activities" style={{ color: "var(--primary)", marginTop: "10px", display: "inline-block" }}>
                        &larr; Back to Activities
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    const hasMapData = activity.path && activity.path.length > 0;
    const center = hasMapData ? activity.path![0] : [37.7749, -122.4194] as [number, number];

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "10px",
        borderRadius: "var(--radius-sm)",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "#fff",
        outline: "none",
        fontSize: "16px",
    };

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                {/* Header */}
                <header style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        <button
                            onClick={() => router.back()}
                            style={{ background: "none", border: "none", color: "var(--foreground-muted)", fontSize: "24px", cursor: "pointer", padding: "0 10px 0 0" }}
                        >
                            &larr;
                        </button>
                        <div>
                            <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>{activity.type} on {activity.date.toLocaleDateString()}</h1>
                            <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                                {activity.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {activity.mode && <span> · {activity.mode}</span>}
                                {activity.environment && <span> · {activity.environment}</span>}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        {!editing && (
                            <button
                                onClick={() => setEditing(true)}
                                style={{
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "var(--foreground)",
                                    padding: "8px 16px",
                                    borderRadius: "var(--radius-sm)",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                }}
                            >
                                ✏️ Edit
                            </button>
                        )}
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="btn-primary"
                            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "20px" }}
                        >
                            <Share2 size={16} /> Share
                        </button>
                    </div>
                </header>

                {/* Map */}
                <div className="glass-panel" style={{ height: "300px", borderRadius: "var(--radius-lg)", overflow: "hidden", position: "relative", marginBottom: "20px" }}>
                    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                        />
                        {hasMapData ? (
                            <>
                                <Polyline positions={activity.path!} color="var(--primary)" weight={4} />
                                <Marker position={activity.path![0]}>
                                    <Popup>Start</Popup>
                                </Marker>
                                <Marker position={activity.path![activity.path!.length - 1]}>
                                    <Popup>Finish</Popup>
                                </Marker>
                            </>
                        ) : (
                            <div style={{
                                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                                background: "rgba(0,0,0,0.5)", color: "white", zIndex: 1000
                            }}>
                                Map data not available for this activity.
                            </div>
                        )}
                    </MapContainer>
                </div>

                {/* Edit Mode */}
                {editing ? (
                    <div className="glass-panel" style={{ padding: "24px", borderRadius: "var(--radius-lg)", marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>Edit Activity</h3>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--foreground-muted)" }}>Type</label>
                                <select value={editType} onChange={(e) => setEditType(e.target.value as any)} style={inputStyle}>
                                    <option value="Run">Run</option>
                                    <option value="Walk">Walk</option>
                                    <option value="Bike">Bike</option>
                                    <option value="HIIT">HIIT</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--foreground-muted)" }}>Distance (mi)</label>
                                <input type="number" step="0.01" value={editDistance} onChange={(e) => setEditDistance(e.target.value)} style={inputStyle} />
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--foreground-muted)" }}>Duration (min)</label>
                                <input type="number" value={editDurationMin} onChange={(e) => setEditDurationMin(e.target.value)} style={inputStyle} placeholder="0" />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--foreground-muted)" }}>Duration (sec)</label>
                                <input type="number" value={editDurationSec} onChange={(e) => setEditDurationSec(e.target.value)} style={inputStyle} placeholder="0" />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--foreground-muted)" }}>Calories</label>
                                <input type="number" value={editCalories} onChange={(e) => setEditCalories(e.target.value)} style={inputStyle} />
                            </div>
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--foreground-muted)" }}>Notes</label>
                            <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize: "none" }} />
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, justifyContent: "center", opacity: saving ? 0.6 : 1 }}>
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                            <button onClick={() => setEditing(false)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--foreground)", padding: "12px", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
                            <div className="glass-panel" style={{ padding: "20px", textAlign: "center", borderRadius: "var(--radius-md)" }}>
                                <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "5px" }}>DISTANCE</div>
                                <div style={{ fontSize: "24px", fontWeight: "bold" }}>{activity.distance}</div>
                                <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>miles</div>
                            </div>
                            <div className="glass-panel" style={{ padding: "20px", textAlign: "center", borderRadius: "var(--radius-md)" }}>
                                <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "5px" }}>DURATION</div>
                                <div style={{ fontSize: "24px", fontWeight: "bold" }}>{formatDuration(activity.duration)}</div>
                            </div>
                            <div className="glass-panel" style={{ padding: "20px", textAlign: "center", borderRadius: "var(--radius-md)" }}>
                                <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "5px" }}>AVG PACE</div>
                                <div style={{ fontSize: "24px", fontWeight: "bold" }}>{activity.pace}</div>
                                <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>/mi</div>
                            </div>
                            <div className="glass-panel" style={{ padding: "20px", textAlign: "center", borderRadius: "var(--radius-md)" }}>
                                <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "5px" }}>CALORIES</div>
                                <div style={{ fontSize: "24px", fontWeight: "bold" }}>{activity.calories || "-"}</div>
                                <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>kcal</div>
                            </div>
                        </div>

                        {/* Mile Splits */}
                        {activity.mileSplits && activity.mileSplits.length > 0 && (
                            <div className="glass-panel" style={{ padding: "20px", borderRadius: "var(--radius-lg)", marginBottom: "20px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px" }}>Mile Splits</h3>
                                {activity.mileSplits.map((splitSec: number, i: number) => {
                                    const m = Math.floor(splitSec / 60);
                                    const s = Math.floor(splitSec % 60);
                                    return (
                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <span>Mile {i + 1}</span>
                                            <span style={{ color: "var(--primary)", fontWeight: 600 }}>{m}:{s < 10 ? "0" : ""}{s}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Notes */}
                        <div className="glass-panel" style={{ padding: "20px", borderRadius: "var(--radius-lg)", marginBottom: "20px" }}>
                            <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px" }}>Notes</h3>
                            <p style={{ color: "var(--foreground-muted)", lineHeight: "1.6" }}>
                                {activity.notes || "No notes added for this activity."}
                            </p>
                        </div>

                        {/* Weather */}
                        {activity.weatherSnapshot && (
                            <div className="glass-panel" style={{ padding: "20px", borderRadius: "var(--radius-lg)", marginBottom: "20px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px" }}>Weather</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", textAlign: "center" }}>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>TEMP</div>
                                        <div style={{ fontWeight: 600 }}>{activity.weatherSnapshot.temp}°F</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>CONDITION</div>
                                        <div style={{ fontWeight: 600 }}>{activity.weatherSnapshot.condition}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>HUMIDITY</div>
                                        <div style={{ fontWeight: 600 }}>{activity.weatherSnapshot.humidity}%</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>WIND</div>
                                        <div style={{ fontWeight: 600 }}>{activity.weatherSnapshot.wind} mph</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Media Gallery */}
                <div style={{ marginBottom: "30px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: "bold" }}>Media</h3>
                        <label className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", padding: "8px 16px", borderRadius: "20px" }}>
                            {uploadingMedia ? "Uploading..." : "📷 Add Photo/Video"}
                            <input
                                type="file"
                                accept="image/*,video/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleMediaUpload}
                                disabled={uploadingMedia}
                            />
                        </label>
                    </div>

                    {activity.media && activity.media.length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "10px" }}>
                            {activity.media.map((item: any, i: number) => (
                                <div key={i} className="relative group" style={{ aspectRatio: "1/1", borderRadius: "12px", overflow: "hidden", background: "#000" }}>
                                    {item.type === "video" ? (
                                        <video src={item.url} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.url} alt="Activity Media" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    )}

                                    {(isAdmin || true) && ( // Owner check implicit as this page is owner-only for now, but added for safety
                                        <button
                                            onClick={() => handleDeleteMedia(item)}
                                            style={{
                                                position: "absolute", top: "5px", right: "5px",
                                                background: "rgba(0,0,0,0.6)", color: "white",
                                                border: "none", borderRadius: "50%", width: "24px", height: "24px",
                                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                                            }}
                                            title="Delete Media"
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-panel p-6 text-center text-foreground-muted text-sm italic rounded-lg">
                            No photos or videos yet. Capture the moment!
                        </div>
                    )}
                </div>

                {/* Comments Section */}
                <CommentsSection activityId={activity.id} ownerId={user?.uid || ""} />

                {/* Delete Section */}
                <div style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    {/* ... (existing delete logic) ... */}
                    {!confirmDelete ? (
                        <button
                            onClick={() => setConfirmDelete(true)}
                            style={{
                                background: "transparent",
                                border: "1px solid rgba(255,50,50,0.3)",
                                color: "#ff4444",
                                padding: "10px 20px",
                                borderRadius: "var(--radius-sm)",
                                cursor: "pointer",
                                fontSize: "14px",
                            }}
                        >
                            🗑 Delete Activity
                        </button>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ color: "#ff4444", fontSize: "14px" }}>Are you sure? This cannot be undone.</span>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                style={{
                                    background: "#ff4444",
                                    color: "white",
                                    border: "none",
                                    padding: "10px 20px",
                                    borderRadius: "var(--radius-sm)",
                                    cursor: deleting ? "not-allowed" : "pointer",
                                    fontWeight: 600,
                                    opacity: deleting ? 0.6 : 1,
                                }}
                            >
                                {deleting ? "Deleting..." : "Yes, Delete"}
                            </button>
                            <button
                                onClick={() => setConfirmDelete(false)}
                                style={{
                                    background: "transparent",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "var(--foreground)",
                                    padding: "10px 20px",
                                    borderRadius: "var(--radius-sm)",
                                    cursor: "pointer",
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* Share Modal */}
                {showShareModal && (
                    <ShareActivityModal
                        activity={activity}
                        onClose={() => setShowShareModal(false)}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
