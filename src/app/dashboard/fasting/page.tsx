"use client";

import FastingTimer from "@/components/dashboard/fasting/FastingTimer";
import { useAuth } from "@/context/AuthContext";
import { useActivities } from "@/hooks/useActivities";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Trash2, Edit2, Loader2, Share2, Volume2, Mic, Settings } from "lucide-react";
import SpeechControls from "@/components/dashboard/SpeechControls";
import ShareActivityModal from "@/components/dashboard/ShareActivityModal";
import { useVoice } from "@/hooks/useVoice";
import { formatDuration } from "@/lib/utils";

export default function FastingPage() {
    const { user } = useAuth();
    const { activities, loading, deleteActivity, updateActivity } = useActivities();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
    const [showShareModal, setShowShareModal] = useState(false);

    // Filter and format fasting history
    const history = useMemo(() => {
        return activities
            .filter(a => a.type === "Fasting")
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [activities]);

    const handleDelete = async (id: string) => {
        if (!confirm("Move to Trash? Recoverable for 30 days.")) return;
        setIsDeleting(id);
        try {
            await deleteActivity(id);
        } catch (e) {
            console.error(e);
            alert("Failed to delete activity");
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 16px", paddingBottom: "40px" }}>
            {/* Back Arrow */}
            <div style={{ marginBottom: "16px", marginTop: "8px" }}>
                <Link href="/dashboard" style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--foreground-muted)",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 600,
                    transition: "color 0.2s",
                }}>
                    ← Dashboard
                </Link>
            </div>

            {/* Header */}
            <header style={{ marginBottom: "32px", textAlign: "center", position: "relative" }}>
                <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 20px",
                    borderRadius: "var(--radius-full, 24px)",
                    background: "rgba(204,255,0,0.1)",
                    border: "1px solid rgba(204,255,0,0.2)",
                    marginBottom: "12px",
                }}>
                    <span style={{ marginRight: "8px", fontSize: "18px" }}>🔥</span>
                    <span style={{ color: "var(--primary)", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "1px" }}>Metabolic Health</span>
                </div>
                <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, marginBottom: "12px" }}>
                    Fasting <span style={{ color: "var(--primary)" }}>Tracker</span>
                </h1>
                <p style={{ fontSize: "16px", color: "var(--foreground-muted)", maxWidth: "500px", margin: "0 auto", lineHeight: "1.5" }}>
                    Optimize your cellular repair and metabolic flexibility through intermittent fasting.
                </p>
            </header>

            {/* Main Content Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "24px",
            }}>
                {/* Timer Section */}
                <div className="glass-panel" style={{ padding: "clamp(20px, 4vw, 48px)", borderRadius: "16px", position: "relative", overflow: "hidden" }}>
                    <FastingTimer />
                </div>

                {/* Info Cards Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", borderRadius: "16px" }}>
                        <span style={{ fontSize: "28px", marginBottom: "10px" }}>🔬</span>
                        <h3 style={{ fontWeight: 700, fontSize: "15px" }}>Autophagy</h3>
                        <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "4px" }}>Cellular repair &amp; cleaning</p>
                    </div>
                    <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", borderRadius: "16px" }}>
                        <span style={{ fontSize: "28px", marginBottom: "10px" }}>🔥</span>
                        <h3 style={{ fontWeight: 700, fontSize: "15px" }}>Fat Burn</h3>
                        <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "4px" }}>Ketosis &amp; lipid oxidation</p>
                    </div>
                </div>

                {/* Benefits Card */}
                <div className="glass-panel" style={{ padding: "24px", borderRadius: "16px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ width: "4px", height: "20px", background: "var(--primary)", borderRadius: "2px", display: "inline-block" }} />
                        Physiological Benefits
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {[
                            { title: "Insulin Sensitivity", desc: "Lowers blood sugar & insulin resistance.", icon: "💉" },
                            { title: "HGH Production", desc: "Boosts growth hormone for muscle preservation.", icon: "💪" },
                            { title: "Mental Clarity", desc: "BDNF increase for sharper focus.", icon: "🧠" },
                            { title: "Inflammation", desc: "Reduces systemic inflammation markers.", icon: "🛡️" }
                        ].map((item, i) => (
                            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                <div style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "14px",
                                    flexShrink: 0,
                                }}>
                                    {item.icon}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: "14px" }}>{item.title}</div>
                                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Fasts */}
                <div className="glass-panel" style={{ padding: "24px", borderRadius: "16px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                        ⏱️ Recent Fasts
                    </h3>

                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ height: "48px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", animation: "pulse 1.5s infinite" }} />
                            ))}
                        </div>
                    ) : history.length === 0 ? (
                        <div style={{
                            textAlign: "center",
                            padding: "32px 16px",
                            border: "1px dashed rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                            background: "rgba(255,255,255,0.02)",
                        }}>
                            <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                                No completed fasts yet.<br />Your journey begins with the first step.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto" }}>
                            {history.map(log => (
                                <div 
                                    key={log.id} 
                                    onClick={() => setSelectedHistoryItem(log)}
                                    style={{
                                        padding: "14px 16px",
                                        borderRadius: "12px",
                                        background: "rgba(255,255,255,0.03)",
                                        border: "1px solid rgba(255,255,255,0.05)",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        cursor: "pointer",
                                        transition: "background 0.2s",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{
                                            width: "36px",
                                            height: "36px",
                                            borderRadius: "8px",
                                            background: "rgba(0,0,0,0.3)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "14px",
                                        }}>
                                            📅
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: "14px" }}>
                                                {new Date(log.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                                            </div>
                                            <div style={{ fontSize: "10px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{log.mode || "Custom"}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontWeight: 700, fontSize: "18px", color: "var(--primary)", fontFamily: "monospace" }}>
                                                {(Number(log.duration) / 3600).toFixed(1)}
                                            </div>
                                            <div style={{ fontSize: "10px", color: "var(--foreground-muted)" }}>hours</div>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <Edit2 size={16} color="var(--foreground-muted)" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detail Modal */}
                {selectedHistoryItem && (
                    <FastHistoryDetailModal 
                        item={selectedHistoryItem}
                        onClose={() => setSelectedHistoryItem(null)}
                        onDelete={(id) => {
                            if (confirm("Move to Trash? Recoverable for 30 days.")) {
                                deleteActivity(id);
                                setSelectedHistoryItem(null);
                            }
                        }}
                    />
                )}
            </div>

            <style jsx>{`
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
            `}</style>
        </div>
    );
}

function FastHistoryDetailModal({ item, onClose, onDelete }: { item: any, onClose: () => void, onDelete: (id: string) => void }) {
    const { isPlaying, speak, stopSpeaking } = useVoice();
    const { isRecording, isTranscribing, startRecording, stopRecording } = useVoice();
    const { updateActivity } = useActivities();
    
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [notes, setNotes] = useState(item.notes || "");
    const [editDate, setEditDate] = useState(new Date(item.date).toISOString().split('T')[0]);
    const [editHours, setEditHours] = useState(Math.floor(item.duration / 3600).toString());
    const [editMinutes, setEditMinutes] = useState(Math.floor((item.duration % 3600) / 60).toString());

    const handleSpeak = () => {
        const hours = (Number(item.duration) / 3600).toFixed(1);
        speak(`Fasting session completed on ${new Date(item.date).toLocaleDateString()}. Total duration: ${hours} hours. Metabolic stage: ${item.mode || "Custom"}. Notes: ${item.notes || "No notes recorded."}`);
    };

    const handleTranscription = async () => {
        const text = await stopRecording();
        if (text) setNotes(prev => prev + (prev ? " " : "") + text);
    };

    const handleSaveEdit = async () => {
        setIsSaving(true);
        try {
            const h = parseInt(editHours) || 0;
            const m = parseInt(editMinutes) || 0;
            const newDuration = (h * 3600) + (m * 60);
            
            // Ensure date preserves time if possible, or just start of day
            const newDate = new Date(editDate);
            
            await updateActivity(item.id, { 
                notes,
                duration: newDuration,
                date: newDate
            });
            
            // Local state update
            item.notes = notes;
            item.duration = newDuration;
            item.date = newDate;
            
            setIsEditing(false);
        } catch (e: any) {
            alert("Update failed: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "10px",
        borderRadius: "8px",
        background: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "#fff",
        fontSize: "14px",
        outline: "none"
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div className="glass-panel" style={{ maxWidth: "500px", width: "100%", padding: "32px", borderRadius: "24px", background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                    <div>
                        <div style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Metabolic Summary</div>
                        <h2 style={{ fontSize: "24px", fontWeight: 800 }}>
                            {isEditing ? "Edit Fast Log" : new Date(item.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h2>
                    </div>
                    <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "24px", cursor: "pointer" }}>&times;</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isEditing ? "1fr" : "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                    {isEditing ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "6px" }}>DATE</label>
                                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} style={inputStyle} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "6px" }}>HOURS</label>
                                    <input type="number" value={editHours} onChange={e => setEditHours(e.target.value)} style={inputStyle} placeholder="Hours" />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "6px" }}>MINUTES</label>
                                    <input type="number" value={editMinutes} onChange={e => setEditMinutes(e.target.value)} style={inputStyle} placeholder="Min" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "4px" }}>DURATION</div>
                                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--primary)" }}>{(Number(item.duration) / 3600).toFixed(1)} <span style={{fontSize: "12px", fontWeight: 400}}>hours</span></div>
                            </div>
                            <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <SpeechControls 
                                    onSpeak={handleSpeak}
                                    onStopSpeaking={stopSpeaking}
                                    isPlaying={isPlaying}
                                    showMic={false}
                                />
                            </div>
                        </>
                    )}
                </div>

                <div style={{ marginBottom: "32px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)", fontWeight: 600 }}>METABOLIC NOTES</div>
                        <button onClick={() => setIsEditing(!isEditing)} style={{ background: "transparent", border: "none", color: "var(--primary)", fontSize: "12px", cursor: "pointer" }}>
                            {isEditing ? "Cancel" : "Edit"}
                        </button>
                    </div>
                    {isEditing ? (
                        <div style={{ position: "relative" }}>
                            <textarea 
                                value={notes} 
                                onChange={e => setNotes(e.target.value)}
                                style={{ ...inputStyle, minHeight: "100px", paddingRight: "40px", resize: "none" }}
                                placeholder="How did you feel?"
                            />
                            <div style={{ position: "absolute", bottom: "10px", right: "10px" }}>
                                <SpeechControls 
                                    onStartRecording={startRecording}
                                    onStopRecording={handleTranscription}
                                    isRecording={isRecording}
                                    isTranscribing={isTranscribing}
                                    size={14}
                                    showSpeaker={false}
                                />
                            </div>
                        </div>
                    ) : (
                        <p style={{ color: "#fff", lineHeight: 1.6, fontSize: "15px" }}>{item.notes || "No notes recorded for this fast."}</p>
                    )}
                    {isEditing && (
                        <button onClick={handleSaveEdit} disabled={isSaving} className="btn-primary" style={{ marginTop: "16px", width: "100%", padding: "12px", borderRadius: "12px", justifyContent: "center", opacity: isSaving ? 0.6 : 1 }}>
                            {isSaving ? "Saving..." : "Save Updates"}
                        </button>
                    )}
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={() => onDelete(item.id)} style={{ flex: 1, padding: "12px", background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.3)", color: "#ff4444", borderRadius: "12px", cursor: "pointer", fontWeight: 600 }}>Delete</button>
                    <button className="btn-primary" style={{ flex: 2, padding: "12px", borderRadius: "12px", justifyContent: "center" }}><Share2 size={18} style={{marginRight: "8px"}} /> Share Fast</button>
                </div>
            </div>
        </div>
    );
}
