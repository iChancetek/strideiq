"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TrainingWizard from "@/components/dashboard/TrainingWizard";
import { TrainingPlan, Workout } from "@/lib/types/training";
import { useAuth } from "@/context/AuthContext";
import { authenticatedFetch } from "@/lib/api-client";
import { Loader2, CheckCircle2, Circle, MessageSquare, Mic, MicOff, Youtube, ChevronLeft, ChevronRight, X } from "lucide-react";

export default function TrainingPlanPage() {
    const { user } = useAuth();
    const [plan, setPlan] = useState<TrainingPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [showNoteModal, setShowNoteModal] = useState<{ week: number, day: number } | null>(null);
    
    // Voice State
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const fetchPlan = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await authenticatedFetch("/api/training/plan");
            const data = await res.json();
            if (data.plan) {
                setPlan(data.plan);
            }
        } catch (e) {
            console.error("Failed to fetch plan:", e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchPlan();
    }, [fetchPlan]);

    const handleUpdateProgress = async (weekIdx: number, workoutIdx: number, completed: boolean, note?: string) => {
        const updateKey = `${weekIdx}-${workoutIdx}`;
        setUpdatingId(updateKey);
        try {
            const res = await authenticatedFetch("/api/training/plan", {
                method: "POST",
                body: JSON.stringify({ weekIndex: weekIdx, workoutIndex: workoutIdx, completed, note })
            });
            if (res.ok) {
                // Optimistic UI update or full refetch
                await fetchPlan();
                if (note) setShowNoteModal(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUpdatingId(null);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                await transcribeAudio(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone access denied", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const transcribeAudio = async (blob: Blob) => {
        setIsTranscribing(true);
        const formData = new FormData();
        formData.append("file", blob, "note.webm");

        try {
            const res = await fetch("/api/ai/transcribe", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (data.text && showNoteModal) {
                await handleUpdateProgress(showNoteModal.week, showNoteModal.day, true, data.text);
            }
        } catch (e) {
            console.error("Transcription failed", e);
        } finally {
            setIsTranscribing(false);
        }
    };

    if (loading && !plan) {
        return (
            <DashboardLayout>
                <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Loader2 className="animate-spin" size={48} color="var(--primary)" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto", paddingBottom: "100px" }}>
                <header style={{ textAlign: "center", marginBottom: "40px" }}>
                    <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, marginBottom: "12px" }}>
                        Training <span style={{ color: "var(--primary)" }}>Intelligence</span>
                    </h1>
                    <p style={{ color: "var(--foreground-muted)", fontSize: "16px" }}>
                        {plan ? `Targeting: ${plan.goal}` : "Generate a 7-Day optimized roadmap with AI."}
                    </p>
                </header>

                {!plan ? (
                    <TrainingWizard onPlanGenerated={setPlan} />
                ) : (
                    <div className="fade-in">
                        {/* Week Navigator */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", marginBottom: "40px" }}>
                            <button 
                                onClick={() => setCurrentWeekIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentWeekIndex === 0}
                                style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: currentWeekIndex === 0 ? "default" : "pointer", opacity: currentWeekIndex === 0 ? 0.3 : 1 }}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <div style={{ textAlign: "center" }}>
                                <h2 style={{ fontSize: "24px", fontWeight: 800 }}>Week {plan.weeks[currentWeekIndex].week}</h2>
                                <span style={{ fontSize: "12px", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>{plan.weeks[currentWeekIndex].focus}</span>
                            </div>
                            <button 
                                onClick={() => setCurrentWeekIndex(prev => Math.min(plan.weeks.length - 1, prev + 1))}
                                disabled={currentWeekIndex === plan.weeks.length - 1}
                                style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: currentWeekIndex === plan.weeks.length - 1 ? "default" : "pointer", opacity: currentWeekIndex === plan.weeks.length - 1 ? 0.3 : 1 }}
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>

                        {/* Workout Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                            {plan.weeks[currentWeekIndex].workouts.map((workout, idx) => (
                                <div key={idx} className="glass-panel" style={{ 
                                    padding: "24px", 
                                    borderRadius: "16px", 
                                    border: workout.completed ? "1px solid var(--primary)" : "1px solid rgba(255,255,255,0.1)",
                                    background: workout.completed ? "rgba(204, 255, 0, 0.05)" : "rgba(255,255,255,0.02)",
                                    transition: "all 0.3s ease",
                                    position: "relative"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <div style={{ background: "rgba(0,0,0,0.3)", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, color: "var(--foreground-muted)" }}>{workout.day.toUpperCase()}</div>
                                            <span style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 700 }}>{workout.type}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleUpdateProgress(currentWeekIndex, idx, !workout.completed)}
                                            style={{ background: "transparent", border: "none", cursor: "pointer", color: workout.completed ? "var(--primary)" : "var(--foreground-muted)" }}
                                        >
                                            {updatingId === `${currentWeekIndex}-${idx}` ? <Loader2 size={24} className="animate-spin" /> : 
                                             workout.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                        </button>
                                    </div>

                                    <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>{workout.distance || (workout.type === "Rest" ? "Physical Recovery" : "Active Session")}</h3>
                                    <p style={{ color: "var(--foreground-muted)", fontSize: "14px", lineHeight: "1.6", marginBottom: "20px" }}>{workout.description}</p>

                                    <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                                        {workout.videoUrl && (
                                            <a href={workout.videoUrl} target="_blank" rel="noreferrer" style={{ 
                                                display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,0,0,0.1)", color: "#ff4444", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,0,0,0.2)"
                                            }}>
                                                <Youtube size={16} /> Demo
                                            </a>
                                        )}
                                        <button 
                                            onClick={() => setShowNoteModal({ week: currentWeekIndex, day: idx })}
                                            style={{ 
                                                display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.05)", color: "#fff", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer"
                                            }}>
                                            <MessageSquare size={16} /> {workout.note ? "Edit Note" : "Reflection"}
                                        </button>
                                    </div>

                                    {workout.note && (
                                        <div style={{ marginTop: "16px", padding: "12px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", fontSize: "13px", fontStyle: "italic", borderLeft: "2px solid var(--primary)" }}>
                                            "{workout.note}"
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* End Activity / Cancel Button */}
                        <div style={{ marginTop: "60px", textAlign: "center" }}>
                            <button 
                                onClick={() => { if(confirm("This will permanently remove your active training plan. Continue?")) setPlan(null); }}
                                style={{ background: "rgba(255,50,50,0.1)", color: "#ff5555", border: "1px solid rgba(255,50,50,0.2)", padding: "12px 32px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
                            >
                                Cancel Current Plan
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Note Modal */}
            {showNoteModal !== null && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div className="glass-panel" style={{ width: "100%", maxWidth: "500px", padding: "32px", borderRadius: "24px", position: "relative", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <button 
                            onClick={() => setShowNoteModal(null)}
                            style={{ position: "absolute", top: "20px", right: "20px", background: "transparent", border: "none", color: "var(--foreground-muted)", cursor: "pointer" }}
                        >
                            <X size={24} />
                        </button>
                        
                        <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Post-Session Reflection</h2>
                        <p style={{ color: "var(--foreground-muted)", marginBottom: "24px", fontSize: "14px" }}>Record your thoughts or any physical indicators like soreness or pain.</p>
                        
                        <textarea 
                            defaultValue={plan?.weeks[showNoteModal.week].workouts[showNoteModal.day].note}
                            id="note-textarea"
                            placeholder="How did you feel during the run?"
                            style={{ width: "100%", minHeight: "120px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px", color: "#fff", resize: "none", outline: "none", marginBottom: "20px" }}
                        />

                        <div style={{ display: "flex", gap: "10px" }}>
                            <button 
                                onClick={() => {
                                    const val = (document.getElementById('note-textarea') as HTMLTextAreaElement).value;
                                    handleUpdateProgress(showNoteModal.week, showNoteModal.day, true, val);
                                }}
                                className="btn-primary"
                                style={{ flex: 1, height: "50px", borderRadius: "12px" }}
                            >
                                Save Note
                            </button>
                            <button 
                                onMouseDown={startRecording}
                                onMouseUp={stopRecording}
                                onTouchStart={startRecording}
                                onTouchEnd={stopRecording}
                                style={{ 
                                    width: "50px", height: "50px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center",
                                    background: isRecording ? "#ff4444" : "rgba(255,255,255,0.1)", color: "#fff", border: "none", cursor: "pointer",
                                    boxShadow: isRecording ? "0 0 20px #ff4444" : "none", transition: "all 0.2s"
                                }}
                            >
                                {isTranscribing ? <Loader2 size={24} className="animate-spin" /> : isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                            </button>
                        </div>
                        {isRecording && <p style={{ fontSize: "12px", color: "#ff4444", textAlign: "center", marginTop: "10px", fontWeight: 700 }}>Recording... Release to Transcribe</p>}
                    </div>
                </div>
            )}

            <style jsx>{`
                .fade-in { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </DashboardLayout>
    );
}
