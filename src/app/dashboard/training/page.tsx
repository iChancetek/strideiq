"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TrainingWizard from "@/components/dashboard/TrainingWizard";
import { TrainingPlan, Workout } from "@/lib/types/training";
import { useAuth } from "@/context/AuthContext";
import { authenticatedFetch } from "@/lib/api-client";
import { Loader2, CheckCircle2, Circle, MessageSquare, Youtube, ChevronLeft, ChevronRight, X, Volume2, Mic } from "lucide-react";
import SpeechControls from "@/components/dashboard/SpeechControls";
import { useVoice } from "@/hooks/useVoice";

export default function TrainingPlanPage() {
    const { user } = useAuth();
    const [plan, setPlan] = useState<TrainingPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [showNoteModal, setShowNoteModal] = useState<{ week: number, day: number } | null>(null);
    
    // Unified Voice
    const { 
        isPlaying, speak, stopSpeaking, 
        isRecording, isTranscribing, startRecording, stopRecording 
    } = useVoice();
    const [noteText, setNoteText] = useState("");

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

    const handleTranscription = async () => {
        const text = await stopRecording();
        if (text) {
            setNoteText(prev => prev + (prev ? " " : "") + text);
        }
    };

    const handleSpeakWorkout = (workout: Workout) => {
        speak(`${workout.day} workout. ${workout.type}. ${workout.distance || ""}. ${workout.description}`);
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
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{ background: "rgba(0,0,0,0.3)", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, color: "var(--foreground-muted)" }}>{workout.day.toUpperCase()}</div>
                                            <span style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 700 }}>{workout.type}</span>
                                            <SpeechControls 
                                                onSpeak={() => handleSpeakWorkout(workout)}
                                                onStopSpeaking={stopSpeaking}
                                                isPlaying={isPlaying}
                                                showMic={false}
                                                size={14}
                                            />
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
                                            onClick={() => {
                                                setNoteText(workout.note || "");
                                                setShowNoteModal({ week: currentWeekIndex, day: idx });
                                            }}
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
                                onClick={() => { if(confirm("Move this plan to Trash? Recoverable for 30 days.")) setPlan(null); }}
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
                        
                        <div style={{ position: "relative" }}>
                            <textarea 
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                placeholder="How did you feel during the run?"
                                style={{ width: "100%", minHeight: "120px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px", paddingRight: "50px", color: "#fff", resize: "none", outline: "none", marginBottom: "20px" }}
                            />
                            <div style={{ position: "absolute", bottom: "30px", right: "10px" }}>
                                <SpeechControls 
                                    onStartRecording={startRecording}
                                    onStopRecording={handleTranscription}
                                    isRecording={isRecording}
                                    isTranscribing={isTranscribing}
                                    showSpeaker={false}
                                    size={18}
                                />
                            </div>
                        </div>

                        <button 
                            onClick={() => handleUpdateProgress(showNoteModal.week, showNoteModal.day, true, noteText)}
                            className="btn-primary"
                            style={{ width: "100%", height: "50px", borderRadius: "12px" }}
                        >
                            Save Reflection
                        </button>
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
