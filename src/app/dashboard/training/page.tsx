"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TrainingWizard from "@/components/dashboard/TrainingWizard";
import { TrainingPlan } from "@/lib/types/training";

export default function TrainingPlanPage() {
    const [plan, setPlan] = useState<TrainingPlan | null>(null);

    return (
        <DashboardLayout>
            <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
                <header style={{ textAlign: "center", marginBottom: "40px" }}>
                    <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>AI Training Plan</h1>
                    <p style={{ color: "var(--foreground-muted)" }}>
                        {plan ? `Your ${plan.weeks.length}-Week Journey to ${plan.goal}` : "Generate a personalized structured plan powered by GPT-5.2 Elite Agent."}
                    </p>
                </header>

                {!plan ? (
                    <TrainingWizard onPlanGenerated={setPlan} />
                ) : (
                    <div className="fade-in">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                            <h2 style={{ fontSize: "24px" }}>Week 1 Focus: {plan.weeks[0].focus}</h2>
                            <button
                                onClick={() => setPlan(null)} // Reset for demo
                                style={{ background: "rgba(255,255,255,0.1)", border: "none", padding: "8px 16px", borderRadius: "8px", color: "#fff", cursor: "pointer" }}
                            >
                                Reset Plan
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {plan.weeks[0].workouts.map((workout, index) => (
                                <div key={index} className="glass-panel" style={{ padding: "20px", borderRadius: "12px", borderLeft: `4px solid ${workout.type === "Rest" ? "var(--foreground-muted)" : "var(--primary)"}` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                        <span style={{ fontWeight: 600, color: "var(--primary)" }}>{workout.day}</span>
                                        <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{workout.type}</span>
                                    </div>
                                    <h3 style={{ fontSize: "18px", marginBottom: "5px" }}>{workout.distance || "Recovery"}</h3>
                                    <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: "1.5" }}>
                                        {workout.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <style jsx>{`
                .fade-in { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </DashboardLayout>
    );
}
