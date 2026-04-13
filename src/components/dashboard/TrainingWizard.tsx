import { useState, useRef } from "react";
import { TrainingPlan } from "@/lib/types/training";
import { useAuth } from "@/context/AuthContext";
import { authenticatedFetch } from "@/lib/api-client";
import { Mic, MicOff, Loader2, Sparkles, Wand2, ChevronRight, ChevronLeft } from "lucide-react";

interface TrainingWizardProps {
    onPlanGenerated: (plan: TrainingPlan) => void;
}

export default function TrainingWizard({ onPlanGenerated }: TrainingWizardProps) {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [useVoice, setUseVoice] = useState(false);
    const [formData, setFormData] = useState({
        goal: "Finish a 5K",
        level: "Beginner",
        daysPerWeek: 3,
        raceName: "",
        raceDate: "",
    });

    // Voice State
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const goals = [
        "Finish a 5K", "Sub-20 5K", "Finish a 10K", "Sub-45 10K",
        "Finish a Half Marathon", "Sub-1:45 Half",
        "Finish a Marathon", "Sub-4 Marathon", "Boston Qualifier"
    ];

    const levels = ["Beginner", "Intermediate", "Advanced", "Elite"];

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const generatePlan = async (customRequest?: string) => {
        setIsLoading(true);
        try {
            const res = await authenticatedFetch("/api/training/generate", {
                method: "POST",
                body: JSON.stringify({
                    ...formData,
                    customRequest, // AI can use this if provided
                    userId: user?.uid,
                    timeline: formData.goal.includes("Marathon") ? 16 : 8
                }),
            });

            if (!res.ok) throw new Error("Generation failed");
            const plan = await res.json();
            onPlanGenerated(plan);
        } catch (error) {
            console.error(error);
            alert("Failed to generate plan. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];
            recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                await handleVoicePlan(blob);
                stream.getTracks().forEach(track => track.stop());
            };
            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic access denied", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleVoicePlan = async (blob: Blob) => {
        setIsTranscribing(true);
        const fd = new FormData();
        fd.append("file", blob, "request.webm");
        try {
            const res = await fetch("/api/ai/transcribe", { method: "POST", body: fd });
            const data = await res.json();
            if (data.text) {
                // Generate plan using the transcribed text as the primary goal
                await generatePlan(data.text);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsTranscribing(false);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: "40px", maxWidth: "600px", margin: "0 auto", borderRadius: "24px", position: "relative", overflow: "hidden" }}>
            {/* Background Glow */}
            <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "200px", height: "200px", background: "var(--primary)", opacity: 0.1, filter: "blur(60px)", pointerEvents: "none" }} />
            
            <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "30px" }}>
                    <div>
                        <h2 style={{ fontSize: "24px", fontWeight: 800 }}>Elite Training Wizard</h2>
                        <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>GPT-5.2 powered athletic programming.</p>
                    </div>
                    <button 
                        onClick={() => setUseVoice(!useVoice)}
                        style={{ background: useVoice ? "var(--primary)" : "rgba(255,255,255,0.05)", border: "none", padding: "8px 16px", borderRadius: "12px", color: useVoice ? "#000" : "var(--primary)", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
                    >
                        {useVoice ? <Wand2 size={16} /> : <Mic size={16} />} 
                        {useVoice ? "Manual Mode" : "Voice AI Assistant"}
                    </button>
                </div>

                {isLoading || isTranscribing ? (
                    <div style={{ padding: "60px 0", textAlign: "center" }}>
                        <Loader2 size={48} className="animate-spin" style={{ margin: "0 auto 20px", color: "var(--primary)" }} />
                        <h3 style={{ fontSize: "18px", fontWeight: 700 }}>{isTranscribing ? "Transcribing your request..." : "Architecting your 7-day plan..."}</h3>
                        <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginTop: "8px" }}>Fetching demonstration videos and optimizing workload.</p>
                    </div>
                ) : useVoice ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <div style={{ marginBottom: "30px" }}>
                            <div style={{ 
                                width: "100px", height: "100px", borderRadius: "50%", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center",
                                background: isRecording ? "#ff4444" : "rgba(204, 255, 0, 0.1)", color: isRecording ? "#fff" : "var(--primary)",
                                cursor: "pointer", transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                                boxShadow: isRecording ? "0 0 40px rgba(255, 68, 68, 0.4)" : "0 0 20px rgba(204, 255, 0, 0.1)",
                                transform: isRecording ? "scale(1.1)" : "scale(1)"
                            }}
                            onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
                            >
                                {isRecording ? <MicOff size={40} /> : <Mic size={40} />}
                            </div>
                        </div>
                        <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "12px" }}>{isRecording ? "Listening..." : "Describe your Goal"}</h3>
                        <p style={{ color: "var(--foreground-muted)", fontSize: "14px", lineHeight: "1.6", maxWidth: "300px", margin: "0 auto" }}>
                            "Generate a 7-day plan for a marathoner focused on hill repeats and active recovery."
                        </p>
                        {!isRecording && <p style={{ marginTop: "20px", fontSize: "11px", color: "var(--primary)", fontWeight: 700, textTransform: "uppercase" }}>Hold to record</p>}
                    </div>
                ) : (
                    <div>
                        {/* Manual Steps */}
                        <div style={{ display: "flex", gap: "6px", marginBottom: "32px" }}>
                            {[1, 2, 3].map(s => (
                                <div key={s} style={{ flex: 1, height: "4px", borderRadius: "2px", background: s <= step ? "var(--primary)" : "rgba(255,255,255,0.1)" }} />
                            ))}
                        </div>

                        {step === 1 && (
                            <div className="fade-in">
                                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>What's your primary goal?</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    {goals.map(g => (
                                        <button key={g} onClick={() => setFormData({...formData, goal: g})} style={{ padding: "16px", textAlign: "left", borderRadius: "12px", border: formData.goal === g ? "1px solid var(--primary)" : "1px solid rgba(255,255,255,0.05)", background: formData.goal === g ? "rgba(204,255,0,0.1)" : "rgba(255,255,255,0.02)", color: formData.goal === g ? "var(--primary)" : "#fff", cursor: "pointer", transition: "all 0.2s" }}>
                                            {g}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ marginTop: "32px", display: "flex", justifyContent: "flex-end" }}>
                                    <button className="btn-primary" onClick={handleNext} style={{ display: "flex", alignItems: "center", gap: "8px", height: "50px", padding: "0 24px" }}>Next <ChevronRight size={18} /></button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="fade-in">
                                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>Experience & Frequency</h3>
                                
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "12px", display: "block" }}>CURRENT LEVEL</label>
                                <div style={{ display: "flex", gap: "10px", marginBottom: "32px" }}>
                                    {levels.map(l => (
                                        <button key={l} onClick={() => setFormData({...formData, level: l})} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: formData.level === l ? "var(--primary)" : "transparent", color: formData.level === l ? "#000" : "#fff", fontWeight: 700, cursor: "pointer" }}>{l}</button>
                                    ))}
                                </div>

                                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "12px", display: "block" }}>RUN DAYS PER WEEK: {formData.daysPerWeek}</label>
                                <input type="range" min="3" max="7" value={formData.daysPerWeek} onChange={(e) => setFormData({...formData, daysPerWeek: parseInt(e.target.value)})} style={{ width: "100%", accentColor: "var(--primary)", marginBottom: "40px" }} />

                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "none", color: "var(--foreground-muted)", cursor: "pointer" }}><ChevronLeft size={18} /> Back</button>
                                    <button className="btn-primary" onClick={handleNext} style={{ display: "flex", alignItems: "center", gap: "8px", height: "50px", padding: "0 24px" }}>One last thing <ChevronRight size={18} /></button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="fade-in">
                                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Target Event (Optional)</h3>
                                <p style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "24px" }}>If you're training for a specific race, our AI will automatically sync your plan to the race date.</p>
                                
                                <input 
                                    type="text" placeholder="e.g. NYC Marathon 2026" value={formData.raceName} 
                                    onChange={(e) => setFormData({...formData, raceName: e.target.value})}
                                    style={{ width: "100%", padding: "18px", borderRadius: "12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", marginBottom: "32px", fontSize: "15px", outline: "none" }}
                                />

                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "none", color: "var(--foreground-muted)", cursor: "pointer" }}><ChevronLeft size={18} /> Back</button>
                                    <button className="btn-primary" onClick={() => generatePlan()} style={{ display: "flex", alignItems: "center", gap: "10px", height: "54px", padding: "0 32px", fontSize: "16px" }}>
                                        <Sparkles size={18} /> Generate Plan
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                .fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
