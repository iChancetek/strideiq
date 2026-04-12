"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { uploadMediaFiles } from "@/lib/storage";
import { getActiveSession, saveActiveSession, clearActiveSession } from "@/lib/utils/idb";

const GOAL_OPTIONS = [
    { hours: 12, label: "12h", description: "Light" },
    { hours: 16, label: "16h", description: "Popular" },
    { hours: 18, label: "18h", description: "Advanced" },
    { hours: 20, label: "20h", description: "Intense" },
    { hours: 24, label: "24h", description: "Expert" },
];

export default function FastingTimer() {
    const { user } = useAuth();
    const [isFasting, setIsFasting] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [goalHours, setGoalHours] = useState(16);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Enrichment state
    const [showSummary, setShowSummary] = useState(false);
    const [notes, setNotes] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [analyzing, setAnalyzing] = useState(false);

    // Sync with PostgreSQL / Supabase / IndexedDB
    useEffect(() => {
        if (!user) { setLoading(false); return; }

        const fetchStatus = async () => {
             try {
                 // 1. First check IndexedDB (Fastest recovery)
                 const local = await getActiveSession('fasting');
                 if (local && local.status === 'active') {
                     console.log("[FASTING_RESTORE] Found local session:", local);
                     setStartTime(new Date(local.startTime).getTime());
                     setGoalHours(local.goal || 16);
                     setIsFasting(true);
                     setLoading(false);
                     return;
                 }

                 // 2. Fallback to Supabase
                 const res = await fetch(`/api/fasting/status?userId=${user.uid}`);
                 if (res.ok) {
                     const { activeSession } = await res.json();
                     if (activeSession) {
                         setStartTime(new Date(activeSession.startTime).getTime());
                         setGoalHours(activeSession.goal || 16);
                         setIsFasting(true);
                         
                         // Sync to local IDB if missing
                         await saveActiveSession({
                             type: 'fasting',
                             startTime: activeSession.startTime,
                             status: 'active',
                             goal: activeSession.goal
                         });
                     } else {
                         setIsFasting(false);
                         setStartTime(null);
                         setElapsed(0);
                         await clearActiveSession('fasting');
                     }
                 }
             } catch (err) {
                 console.error("Error fetching fasting status:", err);
             } finally {
                 setLoading(false);
             }
        };

        fetchStatus();

        // Setup Supabase Realtime Broadcast
        const channel = supabase.channel(`user:${user.uid}`)
            .on('broadcast', { event: 'fasting-status-changed' }, () => {
                fetchStatus(); // Re-fetch status when changed
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // Timer tick — only when fasting is active
    useEffect(() => {
        if (!isFasting || !startTime) return;
        setElapsed(Date.now() - startTime); // Immediate update on mount
        const interval = setInterval(() => setElapsed(Date.now() - startTime), 1000);
        return () => clearInterval(interval);
    }, [isFasting, startTime]);

    const toggleFasting = async () => {
        if (!user || saving) return;
        
        if (isFasting) {
            setShowSummary(true);
            return;
        }

        setSaving(true);
        try {
            const response = await fetch("/api/fasting/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.uid,
                    action: "start",
                    goalHours
                }),
            });

            if (!response.ok) throw new Error("Status update failed");

            // Persist to IDB locally
            await saveActiveSession({
                type: 'fasting',
                startTime: new Date().toISOString(),
                status: 'active',
                goal: goalHours
            });

        } catch (e) {
            console.error("Fasting start error", e);
        } finally {
            setSaving(false);
        }
    };

    const handleCompleteFast = async () => {
        if (!user || saving) return;
        setSaving(true);
        try {
            // 1. Upload Media
            let mediaItems: any[] = [];
            if (selectedFiles.length > 0) {
                mediaItems = await uploadMediaFiles(selectedFiles, user.uid);
            }

            // 2. Stop Fast
            const response = await fetch("/api/fasting/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.uid,
                    action: "stop",
                    notes,
                    media: mediaItems
                }),
            });

            if (!response.ok) throw new Error("Status update failed");
            
            // Clear from IDB
            await clearActiveSession('fasting');
            
            // 3. Trigger Analysis and show it
            setAnalyzing(true);
            // We'll trust the background trigger for persistence, but fetch it here for UI display
            // In a real app, I'd poll or wait for a specific analysis result
            setShowSummary(false);
            setNotes("");
            setSelectedFiles([]);
        } catch (e) {
            console.error("Fasting stop error", e);
        } finally {
            setSaving(false);
            setAnalyzing(false);
        }
    };

    const formatTime = (ms: number) => {
        const totalSec = Math.floor(ms / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const progress = startTime ? Math.min((elapsed / (goalHours * 3600 * 1000)) * 100, 100) : 0;
    const goalOption = GOAL_OPTIONS.find(o => o.hours === goalHours) || GOAL_OPTIONS[1];

    // Phase label based on elapsed hours
    const elapsedHours = elapsed / 1000 / 3600;
    const phase =
        !isFasting ? "Not Started"
            : elapsedHours < 4 ? "🔄 Digestion"
                : elapsedHours < 8 ? "🏃 Fat Access"
                    : elapsedHours < 12 ? "🔥 Fat Burning"
                        : elapsedHours < 16 ? "💪 Ketosis Begins"
                            : "⚡ Deep Ketosis";

    if (loading) {
        return (
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "300px",
                flexDirection: "column",
                gap: "12px",
                color: "var(--foreground-muted)",
            }}>
                <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "3px solid var(--primary)",
                    borderTopColor: "transparent",
                    animation: "spin 0.8s linear infinite",
                }} />
                <span style={{ fontSize: "14px" }}>Loading fasting status...</span>
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "28px" }}>

            {/* Title */}
            <div style={{ textAlign: "center" }}>
                <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "4px" }}>Intermittent Fasting</h2>
                <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                    {isFasting ? phase : "Select your goal window"}
                </p>
            </div>

            {/* Circular Timer */}
            <div style={{ position: "relative", width: "220px", height: "220px", flexShrink: 0 }}>
                {/* Background ring */}
                <svg width="220" height="220" style={{ position: "absolute", inset: 0 }}>
                    <circle cx="110" cy="110" r="96" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
                    <circle
                        cx="110" cy="110" r="96"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 96}`}
                        strokeDashoffset={`${2 * Math.PI * 96 * (1 - progress / 100)}`}
                        transform="rotate(-90 110 110)"
                        style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                </svg>
                {/* Inner content */}
                <div style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                }}>
                    <div style={{ fontSize: "11px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                        {isFasting ? "Elapsed" : "Ready to Fast?"}
                    </div>
                    <div style={{ fontSize: "32px", fontWeight: 800, fontFamily: "monospace", letterSpacing: "-1px", color: "var(--foreground)" }}>
                        {isFasting ? formatTime(elapsed) : "0:00:00"}
                    </div>
                    {isFasting && (
                        <div style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600 }}>
                            {progress.toFixed(1)}% of {goalHours}h
                        </div>
                    )}
                </div>
            </div>

            {/* Goal Hour Selector — only when not fasting */}
            {!isFasting && (
                <div style={{ width: "100%" }}>
                    <div style={{
                        fontSize: "12px",
                        color: "var(--foreground-muted)",
                        textAlign: "center",
                        marginBottom: "14px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                    }}>
                        Choose Fasting Window
                    </div>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(5, 1fr)",
                        gap: "8px",
                    }}>
                        {GOAL_OPTIONS.map((opt) => {
                            const isSelected = goalHours === opt.hours;
                            return (
                                <button
                                    key={opt.hours}
                                    onClick={() => setGoalHours(opt.hours)}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "12px 4px",
                                        borderRadius: "14px",
                                        border: isSelected
                                            ? "2px solid var(--primary)"
                                            : "2px solid rgba(255,255,255,0.08)",
                                        background: isSelected
                                            ? "rgba(204,255,0,0.1)"
                                            : "rgba(255,255,255,0.03)",
                                        color: isSelected ? "var(--primary)" : "var(--foreground-muted)",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        gap: "3px",
                                    }}
                                >
                                    <span style={{ fontSize: "15px", fontWeight: 700 }}>{opt.label}</span>
                                    <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.7 }}>
                                        {opt.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* CTA Button */}
            <button
                onClick={toggleFasting}
                disabled={saving}
                style={{
                    padding: "16px 48px",
                    borderRadius: "var(--radius-full, 50px)",
                    fontWeight: 700,
                    fontSize: "16px",
                    cursor: saving ? "not-allowed" : "pointer",
                    border: "none",
                    transition: "all 0.2s ease",
                    opacity: saving ? 0.6 : 1,
                    background: isFasting
                        ? "rgba(255,50,50,0.12)"
                        : "var(--primary)",
                    color: isFasting ? "#ff5555" : "#000",
                    boxShadow: isFasting
                        ? "0 0 0 2px rgba(255,50,50,0.3)"
                        : "0 0 24px rgba(204,255,0,0.3)",
                }}
            >
                {saving ? "Saving..." : isFasting ? "⏹ End Fast" : "▶ Start Fasting"}
            </button>

            {/* Active fast info row */}
            {isFasting && startTime && (
                <div style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginTop: "-8px",
                }}>
                    <div style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "12px",
                        padding: "14px",
                        textAlign: "center",
                    }}>
                        <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "4px" }}>STARTED</div>
                        <div style={{ fontSize: "14px", fontWeight: 700 }}>
                            {new Date(startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                    </div>
                    <div style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "12px",
                        padding: "14px",
                        textAlign: "center",
                    }}>
                        <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "4px" }}>GOAL ENDS</div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--primary)" }}>
                            {new Date(startTime + goalHours * 3600 * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                    </div>
                </div>
            )}
            {/* Summary / Enrichment View */}
            {showSummary && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.8)",
                    backdropFilter: "blur(10px)",
                    zIndex: 100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px"
                }}>
                    <div className="glass-panel" style={{ width: "100%", maxWidth: "400px", padding: "24px" }}>
                        <h3 style={{ marginBottom: "16px" }}>Fast Completed!</h3>
                        <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "20px" }}>
                            You fasted for {formatTime(elapsed)}. Add some details to your elite metabolic history.
                        </p>
                        
                        <label style={{ display: "block", fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "8px" }}>NOTES</label>
                        <textarea 
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="How did you feel during this fast?"
                            style={{
                                width: "100%",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "8px",
                                padding: "12px",
                                color: "#fff",
                                minHeight: "80px",
                                marginBottom: "16px"
                            }}
                        />

                        <label style={{ display: "block", fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "8px" }}>PHOTO / MEAL</label>
                        <input 
                            type="file" 
                            multiple 
                            style={{ display: "none" }} 
                            ref={fileInputRef}
                            onChange={e => { if(e.target.files) setSelectedFiles(Array.from(e.target.files)) }}
                        />
                        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    width: "50px", height: "50px", borderRadius: "8px", border: "1px dashed rgba(255,255,255,0.2)",
                                    background: "rgba(255,255,255,0.02)", color: "var(--foreground-muted)", cursor: "pointer"
                                }}
                            >
                                +
                            </button>
                            {selectedFiles.map((f, i) => (
                                <div key={i} style={{ width: "50px", height: "50px", borderRadius: "8px", background: "rgba(255,255,255,0.1)", fontSize: "8px", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", overflow: "hidden" }}>
                                    {f.name.substring(0, 8)}
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button 
                                className="btn-secondary" 
                                onClick={() => setShowSummary(false)}
                                style={{ flex: 1, padding: "12px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", cursor: "pointer" }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-primary" 
                                onClick={handleCompleteFast}
                                disabled={saving}
                                style={{ flex: 1, padding: "12px", background: "var(--primary)", color: "#000", fontWeight: 700, borderRadius: "12px", border: "none", cursor: "pointer" }}
                            >
                                {saving ? "Saving..." : "Save Fast"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
