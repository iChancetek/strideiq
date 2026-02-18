import { useState } from "react";
import { TrainingPlan } from "@/lib/types/training";

interface TrainingWizardProps {
    onPlanGenerated: (plan: TrainingPlan) => void;
}

export default function TrainingWizard({ onPlanGenerated }: TrainingWizardProps) {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        goal: "Finish a 5K",
        level: "Beginner",
        daysPerWeek: 3,
        raceName: "",
        raceDate: "",
    });

    const goals = [
        "Finish a 5K", "Sub-20 5K", "Finish a 10K", "Sub-45 10K",
        "Finish a Half Marathon", "Sub-1:45 Half",
        "Finish a Marathon", "Sub-4 Marathon", "Boston Qualifier"
    ];

    const levels = ["Beginner", "Intermediate", "Advanced", "Elite"];

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const generatePlan = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/training/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    timeline: formData.goal.includes("Marathon") ? 16 : 8 // Simple logic for now
                }),
            });

            if (!res.ok) throw new Error("Generation failed");

            const plan = await res.json();

            if (!plan || !plan.weeks || !Array.isArray(plan.weeks)) {
                throw new Error("Invalid plan format received");
            }

            onPlanGenerated(plan);
        } catch (error) {
            console.error(error);
            alert("Failed to generate plan. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: "40px", maxWidth: "600px", margin: "0 auto", borderRadius: "16px" }}>
            <h2 style={{ textAlign: "center", marginBottom: "30px" }}>Build Your Elite Plan 🏃‍♂️</h2>

            {/* Progress Bar */}
            <div style={{ display: "flex", gap: "5px", marginBottom: "30px" }}>
                {[1, 2, 3].map((s) => (
                    <div key={s} style={{
                        flex: 1, height: "4px", borderRadius: "2px",
                        background: s <= step ? "var(--primary)" : "rgba(255,255,255,0.1)"
                    }} />
                ))}
            </div>

            {step === 1 && (
                <div>
                    <h3 style={{ marginBottom: "20px" }}>What's your main goal?</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        {goals.map((g) => (
                            <button
                                key={g}
                                onClick={() => setFormData({ ...formData, goal: g })}
                                style={{
                                    padding: "15px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
                                    background: formData.goal === g ? "rgba(204, 255, 0, 0.1)" : "transparent",
                                    color: formData.goal === g ? "var(--primary)" : "var(--foreground)",
                                    cursor: "pointer", textAlign: "left"
                                }}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                    <div style={{ marginTop: "30px", textAlign: "right" }}>
                        <button className="btn-primary" onClick={handleNext}>Next →</button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div>
                    <h3 style={{ marginBottom: "20px" }}>Experience Level & Schedule</h3>

                    <label style={{ display: "block", marginBottom: "10px" }}>Current Level</label>
                    <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                        {levels.map((l) => (
                            <button
                                key={l}
                                onClick={() => setFormData({ ...formData, level: l })}
                                style={{
                                    flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
                                    background: formData.level === l ? "var(--primary)" : "transparent",
                                    color: formData.level === l ? "#000" : "var(--foreground)",
                                    cursor: "pointer"
                                }}
                            >
                                {l}
                            </button>
                        ))}
                    </div>

                    <label style={{ display: "block", marginBottom: "10px" }}>Run Days per Week: {formData.daysPerWeek}</label>
                    <input
                        type="range" min="3" max="7" step="1"
                        value={formData.daysPerWeek}
                        onChange={(e) => setFormData({ ...formData, daysPerWeek: parseInt(e.target.value) })}
                        style={{ width: "100%", accentColor: "var(--primary)", marginBottom: "30px" }}
                    />

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <button onClick={handleBack} style={{ background: "transparent", border: "none", color: "var(--foreground-muted)", cursor: "pointer" }}>← Back</button>
                        <button className="btn-primary" onClick={handleNext}>Next →</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div>
                    <h3 style={{ marginBottom: "20px" }}>Any Specific Race? (Optional)</h3>
                    <input
                        type="text"
                        placeholder="e.g. Boston Marathon 2026"
                        value={formData.raceName}
                        onChange={(e) => setFormData({ ...formData, raceName: e.target.value })}
                        style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", marginBottom: "30px" }}
                    />

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <button onClick={handleBack} style={{ background: "transparent", border: "none", color: "var(--foreground-muted)", cursor: "pointer" }}>← Back</button>
                        <button
                            className="btn-primary"
                            onClick={generatePlan}
                            disabled={isLoading}
                            style={{ opacity: isLoading ? 0.7 : 1 }}
                        >
                            {isLoading ? "Generating Plan (takes ~10s)..." : "Generate Plan ✨"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
