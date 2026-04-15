"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useActivities } from "@/hooks/useActivities";
import { Loader2, History, Info, Trash2, Share2, Edit2 } from "lucide-react";
import SpeechControls from "@/components/dashboard/SpeechControls";
import ShareActivityModal from "@/components/dashboard/ShareActivityModal";
import { useVoice } from "@/hooks/useVoice";
import { getActiveSession, saveActiveSession, clearActiveSession } from "@/lib/utils/idb";

const TRACKS = [
    { id: "focus", label: "Deep Focus", src: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3", color: "#CCFF00" }, // Ambient Piano
    { id: "recovery", label: "Post-Run Recovery", src: "https://cdn.pixabay.com/audio/2024/09/09/audio_248674253c.mp3", color: "#00E5FF" }, // Gentle Stream
    { id: "sleep", label: "Sleep Aid", src: "https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3", color: "#9D4EDD" }, // Deep Drone
];

const DURATIONS = [10, 15, 20, 30];

export default function MeditationPage() {
    const { user } = useAuth();
    const { activities, addActivity, deleteActivity } = useActivities();
    
    // Configuration State
    const [selectedTrack, setSelectedTrack] = useState(TRACKS[0]);
    const [durationMinutes, setDurationMinutes] = useState(10);
    const [notes, setNotes] = useState("");
    const [showNotes, setShowNotes] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [showPostSession, setShowPostSession] = useState(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
    const [showShareModal, setShowShareModal] = useState(false);

    // Voice
    const { isRecording, isTranscribing, isPlaying, speak, stopSpeaking, startRecording, stopRecording } = useVoice();

    // Audio State
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);

    // Session State
    const [isActive, setIsActive] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(10 * 60);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const wakeLockRef = useRef<any>(null);

    // Restore Session on Mount
    useEffect(() => {
        async function restore() {
            try {
                const saved = await getActiveSession('meditation');
                if (saved) {
                    const start = new Date(saved.startTime).getTime();
                    const now = Date.now();
                    const totalSec = saved.durationMinutes * 60;
                    const elapsed = Math.floor((now - start) / 1000);
                    
                    if (elapsed < totalSec) {
                        const track = TRACKS.find(t => t.id === saved.trackId) || TRACKS[0];
                        setSelectedTrack(track);
                        setDurationMinutes(saved.durationMinutes);
                        setStartTime(start);
                        setSecondsLeft(totalSec - elapsed);
                        setIsActive(true);
                        console.log("[MEDITATION_RESTORE] Resuming session from " + new Date(start).toLocaleTimeString());
                    } else {
                        await clearActiveSession('meditation');
                    }
                }
            } catch (e) {
                console.error("Failed to restore meditation", e);
            } finally {
                setLoading(false);
            }
        }
        restore();
    }, []);

    // Wake Lock Logic
    useEffect(() => {
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator && isActive) {
                try {
                    wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                } catch (err: any) {
                    console.log(`Wake Lock error: ${err.message}`);
                }
            }
        };
        requestWakeLock();
        return () => {
            if (wakeLockRef.current) {
                wakeLockRef.current.release().then(() => { wakeLockRef.current = null; });
            }
        };
    }, [isActive]);

    // Resync on Visibility Change (Background/Sleep recovery)
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === "visible" && isActive && startTime) {
                const now = Date.now();
                const totalSec = durationMinutes * 60;
                const elapsed = Math.floor((now - startTime) / 1000);
                const remaining = Math.max(0, totalSec - elapsed);
                setSecondsLeft(remaining);
                console.log("[MEDITATION_SYNC] Visibility sync from wall-clock: " + remaining + "s left");
                
                // Ensure audio is playing if browser paused it
                if (remaining > 0 && audioRef.current && audioRef.current.paused) {
                    audioRef.current.play().catch(() => {});
                }
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, [isActive, startTime, durationMinutes]);

    // Audio volume sync
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    // Timer Tick
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && startTime) {
            interval = setInterval(() => {
                const now = Date.now();
                const totalSec = durationMinutes * 60;
                const elapsed = Math.floor((now - startTime) / 1000);
                const remaining = Math.max(0, totalSec - elapsed);
                setSecondsLeft(remaining);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, startTime, durationMinutes]);

    const saveActivityRecord = useCallback(async (customNotes?: string) => {
        if (!user) return;
        setIsSaving(true);
        try {
            const duration = durationMinutes * 60;
            const finalNotes = customNotes || notes || `Meditated with ${selectedTrack.label} for ${durationMinutes} minutes.`;
            
            await addActivity({
                type: 'Meditation',
                distance: 0,
                duration,
                calories: 0,
                date: new Date(),
                notes: finalNotes,
                mode: 'meditation',
                environment: 'indoor',
            });
            await clearActiveSession('meditation');
            setNotes("");
            setShowNotes(false);
            setShowPostSession(false);
        } catch (e) {
            console.error("Failed to save meditation session", e);
            alert("Failed to save session.");
        } finally {
            setIsSaving(false);
        }
    }, [user, durationMinutes, notes, selectedTrack.label, addActivity]);

    // Completion Handler
    useEffect(() => {
        if (secondsLeft === 0 && isActive) {
            setIsActive(false);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setShowPostSession(true);
        }
    }, [secondsLeft, isActive]);

    const startSession = async () => {
        const startTs = Date.now();
        setStartTime(startTs);
        setSecondsLeft(durationMinutes * 60);
        setIsActive(true);

        // Persist to IDB
        await saveActiveSession({
            type: 'meditation',
            startTime: new Date(startTs).toISOString(),
            trackId: selectedTrack.id,
            durationMinutes: durationMinutes
        });

        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
            audioRef.current.play().catch(e => console.log("Audio play failed"));
        }
    };

    const stopSession = async () => {
        setIsActive(false);
        setStartTime(null);
        setSecondsLeft(durationMinutes * 60);
        await clearActiveSession('meditation');
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ height: "calc(100vh - 200px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Loader2 className="animate-spin" size={48} color="var(--primary)" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", padding: "20px" }}>
                <header style={{ marginBottom: "40px" }}>
                    <h1 style={{ fontSize: "36px", marginBottom: "10px" }}>Mindset & Recovery</h1>
                    <p style={{ color: "var(--foreground-muted)", fontSize: "18px" }}>
                        Center your mind before the run, or recover after.
                    </p>
                </header>

                <div className="glass-panel" style={{
                    padding: "40px",
                    borderRadius: "var(--radius-lg)",
                    position: "relative",
                    overflow: "hidden",
                    border: `1px solid ${isActive ? selectedTrack.color : "transparent"}`,
                    transition: "border 0.5s ease"
                }}>

                    {/* Visualizer Background */}
                    {isActive && (
                        <div className="breathing-circle" style={{ borderColor: selectedTrack.color }}></div>
                    )}

                    <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "30px" }}>

                        {/* 1. Track Selection */}
                        {!isActive && (
                            <div>
                                <label style={{ display: "block", marginBottom: "15px", fontWeight: 600, color: "var(--primary)", letterSpacing: "1px" }}>
                                    🎵 BACKGROUND MUSIC
                                </label>
                                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
                                    {TRACKS.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setSelectedTrack(t)}
                                            style={{
                                                padding: "12px 24px",
                                                borderRadius: "var(--radius-full)",
                                                border: selectedTrack.id === t.id ? `2px solid ${t.color}` : "1px solid rgba(255,255,255,0.1)",
                                                background: selectedTrack.id === t.id ? `${t.color}20` : "rgba(255,255,255,0.05)",
                                                color: selectedTrack.id === t.id ? "#fff" : "var(--foreground-muted)",
                                                fontWeight: selectedTrack.id === t.id ? 700 : 400,
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px"
                                            }}
                                        >
                                            {selectedTrack.id === t.id && <span>▶</span>}
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. Duration Selection */}
                        {!isActive && (
                            <div>
                                <label style={{ display: "block", marginBottom: "15px", fontWeight: 600, color: "var(--foreground-muted)" }}>DURATION (MIN)</label>
                                <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
                                    {DURATIONS.map((min) => (
                                        <button
                                            key={min}
                                            onClick={() => setDurationMinutes(min)}
                                            style={{
                                                width: "60px",
                                                height: "60px",
                                                borderRadius: "50%",
                                                border: `2px solid ${durationMinutes === min ? "var(--primary)" : "rgba(255,255,255,0.1)"}`,
                                                background: durationMinutes === min ? "var(--primary)" : "transparent",
                                                color: durationMinutes === min ? "#000" : "var(--foreground)",
                                                fontWeight: 700,
                                                fontSize: "18px",
                                                cursor: "pointer",
                                                transition: "all 0.2s"
                                            }}
                                        >
                                            {min}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. Timer Display */}
                        <div style={{ margin: "20px 0" }}>
                            <div style={{
                                fontSize: "80px",
                                fontWeight: 700,
                                fontVariantNumeric: "tabular-nums",
                                textShadow: isActive ? `0 0 30px ${selectedTrack.color}40` : "none",
                                transition: "text-shadow 0.5s"
                            }}>
                                {formatTime(secondsLeft)}
                            </div>
                            <div style={{ color: selectedTrack.color, fontWeight: 600, display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                                {isActive && <span className="animate-spin">💿</span>}
                                {isActive ? `PLAYING: ${selectedTrack.label.toUpperCase()}` : "READY"}
                            </div>
                        </div>

                        {/* 4. Controls & Volume */}
                        <div>
                            <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "30px" }}>
                                {!isActive ? (
                                    <button
                                        className="btn-primary"
                                        onClick={startSession}
                                        style={{ minWidth: "200px", fontSize: "18px", padding: "16px 32px" }}
                                    >
                                        Start Session
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopSession}
                                        style={{
                                            background: "rgba(255, 50, 50, 0.2)", color: "#ff3333", border: "1px solid rgba(255, 50, 50, 0.5)",
                                            padding: "16px 32px", borderRadius: "12px", fontSize: "18px", fontWeight: 600, cursor: "pointer"
                                        }}
                                    >
                                        Stop & Reset
                                    </button>
                                )}
                            </div>

                            {isActive && (
                                <div style={{
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "15px",
                                    background: "rgba(0,0,0,0.2)", padding: "15px", borderRadius: "16px",
                                    maxWidth: "400px", margin: "0 auto"
                                }}>
                                    <button
                                        onClick={() => setIsMuted(!isMuted)}
                                        style={{ background: "transparent", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }}
                                    >
                                        {isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
                                    </button>

                                    <input
                                        type="range"
                                        min="0" max="1" step="0.01"
                                        value={isMuted ? 0 : volume}
                                        onChange={(e) => {
                                            setVolume(parseFloat(e.target.value));
                                            if (parseFloat(e.target.value) > 0) setIsMuted(false);
                                        }}
                                        style={{ width: "100%", accentColor: selectedTrack.color, cursor: "pointer" }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Hidden Audio Player */}
                        <audio
                            ref={audioRef}
                            src={selectedTrack.src}
                            loop
                            onError={(e) => {
                                console.error("Audio Missing:", e);
                            }}
                        />

                    </div>
                </div>

                <p style={{ marginTop: "40px", opacity: 0.5, fontSize: "14px" }}>
                    Tip: StrideIQ sessions stay active even if you lock your phone or restart your browser.
                </p>

                {/* Notes Toggle */}
                <div style={{ marginTop: "24px", display: "flex", justifyContent: "center" }}>
                    <button 
                        onClick={() => setShowNotes(!showNotes)}
                        style={{ background: "transparent", border: "none", color: "var(--primary)", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                        <MessageSquare size={16} /> {showNotes ? "Hide Notes" : "Add Reflection Notes"}
                    </button>
                    {showNotes && (
                        <div style={{ position: "absolute", top: "100%", width: "100%", maxWidth: "400px", padding: "12px", background: "rgba(30,30,30,0.9)", backdropFilter: "blur(4px)", borderRadius: "12px", zIndex: 10, marginTop: "10px" }}>
                            <textarea 
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Reflect on your mindset..."
                                style={{ width: "100%", padding: "10px", background: "transparent", border: "none", color: "#fff", resize: "none", outline: "none", minHeight: "80px" }}
                            />
                        </div>
                    )}
                </div>

                {/* History Section */}
                <section style={{ marginTop: "80px", textAlign: "left", maxWidth: "600px", margin: "80px auto 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                        <History size={20} color="var(--primary)" />
                        <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Recovery History</h2>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {activities.filter(a => a.type === "Meditation").slice(0, 10).map(m => (
                            <div 
                                key={m.id} 
                                className="glass-panel" 
                                onClick={() => setSelectedHistoryItem(m)}
                                style={{ 
                                    padding: "16px", 
                                    borderRadius: "12px", 
                                    display: "flex", 
                                    justifyContent: "space-between", 
                                    alignItems: "center", 
                                    background: "rgba(255,255,255,0.02)", 
                                    border: "1px solid rgba(255,255,255,0.05)",
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
                                        🧘
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{m.notes?.substring(0, 40)}{m.notes && m.notes.length > 40 ? "..." : ""}</div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                    <div style={{ color: "var(--primary)", fontWeight: 700 }}>
                                        {Math.round(m.duration / 60)} min
                                    </div>
                                    <Edit2 size={16} color="var(--foreground-muted)" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Post Session Modal */}
                {showPostSession && (
                    <PostSessionReflection 
                        duration={durationMinutes * 60}
                        track={selectedTrack.label}
                        onSave={saveActivityRecord}
                        onDiscard={() => setShowPostSession(false)}
                    />
                )}

                {/* History Detail Modal */}
                {selectedHistoryItem && (
                    <HistoryDetailModal 
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

                {/* Share Modal */}
                {showShareModal && (
                    <ShareActivityModal 
                        activity={selectedHistoryItem}
                        onClose={() => setShowShareModal(false)}
                    />
                )}
            </div>

            <style jsx>{`
                .breathing-circle {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 300px;
                    height: 300px;
                    border-radius: 50%;
                    border: 2px solid;
                    opacity: 0.3;
                    animation: breathe 8s infinite ease-in-out;
                    pointer-events: none;
                }
                @keyframes breathe {
                    0%, 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.1; }
                    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.4; }
                }
            `}</style>
        </DashboardLayout>
    );
}

function PostSessionReflection({ duration, track, onSave, onDiscard }: { duration: number, track: string, onSave: (notes: string) => void, onDiscard: () => void }) {
    const [notes, setNotes] = useState("");
    const { isRecording, isTranscribing, startRecording, stopRecording } = useVoice();

    const handleTranscription = async () => {
        const text = await stopRecording();
        if (text) setNotes(prev => prev + (prev ? " " : "") + text);
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div className="glass-panel" style={{ maxWidth: "500px", width: "100%", padding: "32px", borderRadius: "24px", textAlign: "center", background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🧘</div>
                <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Session Complete</h2>
                <p style={{ color: "var(--foreground-muted)", marginBottom: "24px" }}>
                    You meditated for {Math.round(duration / 60)} minutes with {track}. How do you feel?
                </p>

                <div style={{ position: "relative", marginBottom: "24px" }}>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Reflect on your mindset... (Use the mic to dictate)"
                        style={{ width: "100%", padding: "16px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", resize: "none", outline: "none", minHeight: "120px", fontSize: "16px" }}
                    />
                    <div style={{ position: "absolute", bottom: "12px", right: "12px" }}>
                        <SpeechControls 
                            onStartRecording={startRecording}
                            onStopRecording={handleTranscription}
                            isRecording={isRecording}
                            isTranscribing={isTranscribing}
                            showSpeaker={false}
                        />
                    </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={() => onSave(notes)} className="btn-primary" style={{ flex: 2, padding: "14px", borderRadius: "12px", justifyContent: "center" }}>
                        Save Reflection
                    </button>
                    <button onClick={onDiscard} style={{ flex: 1, padding: "14px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "var(--foreground-muted)", borderRadius: "12px", cursor: "pointer" }}>
                        Discard
                    </button>
                </div>
            </div>
        </div>
    );
}

function HistoryDetailModal({ item, onClose, onDelete }: { item: any, onClose: () => void, onDelete: (id: string) => void }) {
    const { isPlaying, speak, stopSpeaking } = useVoice();
    const { updateActivity } = useActivities();
    
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [notes, setNotes] = useState(item.notes || "");
    const [editDate, setEditDate] = useState(new Date(item.date).toISOString().split('T')[0]);
    const [editMinutes, setEditMinutes] = useState(Math.round(item.duration / 60).toString());

    const handleSpeak = () => {
        speak(`Meditation session on ${new Date(item.date).toLocaleDateString()}. Duration: ${Math.round(item.duration / 60)} minutes. Notes: ${item.notes || "No notes."}`);
    };

    const handleSaveEdit = async () => {
        setIsSaving(true);
        try {
            const m = parseInt(editMinutes) || 0;
            const newDuration = m * 60;
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
                        <div style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Session Details</div>
                        <h2 style={{ fontSize: "24px", fontWeight: 800 }}>
                            {isEditing ? "Edit Session" : new Date(item.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h2>
                    </div>
                    <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "24px", cursor: "pointer" }}>&times;</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isEditing ? "1fr" : "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                    {isEditing ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "6px" }}>SESSION DATE</label>
                                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "6px" }}>DURATION (MINUTES)</label>
                                <input type="number" value={editMinutes} onChange={e => setEditMinutes(e.target.value)} style={inputStyle} />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "4px" }}>DURATION</div>
                                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--primary)" }}>{Math.round(item.duration / 60)} min</div>
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
                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)", fontWeight: 600 }}>REFLECTION NOTES</div>
                        <button onClick={() => setIsEditing(!isEditing)} style={{ background: "transparent", border: "none", color: "var(--primary)", fontSize: "12px", cursor: "pointer" }}>
                            {isEditing ? "Cancel" : "Edit"}
                        </button>
                    </div>
                    {isEditing ? (
                        <textarea 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)}
                            style={{ ...inputStyle, minHeight: "100px", resize: "none" }}
                            placeholder="Reflect on your mindset..."
                        />
                    ) : (
                        <p style={{ color: "#fff", lineHeight: 1.6, fontSize: "15px" }}>{item.notes || "No notes."}</p>
                    )}
                    {isEditing && (
                        <button onClick={handleSaveEdit} disabled={isSaving} className="btn-primary" style={{ marginTop: "16px", width: "100%", padding: "12px", borderRadius: "12px", justifyContent: "center", opacity: isSaving ? 0.6 : 1 }}>
                            {isSaving ? "Saving..." : "Save Updates"}
                        </button>
                    )}
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={() => onDelete(item.id)} style={{ flex: 1, padding: "12px", background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.3)", color: "#ff4444", borderRadius: "12px", cursor: "pointer", fontWeight: 600 }}>Delete</button>
                    <button className="btn-primary" style={{ flex: 2, padding: "12px", borderRadius: "12px", justifyContent: "center" }}><Share2 size={18} style={{marginRight: "8px"}} /> Share Session</button>
                </div>
            </div>
        </div>
    );
}
