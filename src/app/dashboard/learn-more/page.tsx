"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import SpeechControls from "@/components/dashboard/SpeechControls";
import { useVoice } from "@/hooks/useVoice";
import { Mic, Volume2 } from "lucide-react";

const features = [
    {
        title: "Activity Tracking",
        emoji: "🏃",
        color: "var(--primary)",
        description: "Track runs, walks, and bike rides with GPS. Now supports high-resolution video uploads to share your post-session moments.",
        modules: "GPS • Video • Pace • Calories"
    },
    {
        title: "AI Performance Coach",
        emoji: "🤖",
        color: "var(--primary)",
        description: "Chat with your personal AI coach. Choose from Onyx (running), Titan (exercise), or Zen (meditation) for tailored guidance.",
        modules: "Chat • Voice • Personas"
    },
    {
        title: "Social Notifications",
        emoji: "🔔",
        color: "var(--primary)",
        description: "Stay in the loop with real-time alerts. Get notified immediately when friends like or comment on your activities.",
        modules: "Real-time • Likes • Comments"
    },
    {
        title: "Performance Analytics",
        emoji: "📈",
        color: "var(--secondary)",
        description: "Analyze your progress with dynamic aggregation. Switch between Daily, Weekly, Monthly, and Yearly performance views.",
        modules: "Daily • Weekly • Monthly • Yearly"
    },
    {
        title: "Steps & Trends",
        emoji: "👟",
        color: "var(--primary)",
        description: "Track daily steps and monitor long-term trends. The Step Tracker now includes a 12-week historical trend analysis.",
        modules: "Steps • 12-Week Trends • Leaderboard"
    },
    {
        title: "Unified Ecosystem",
        emoji: "🌐",
        color: "var(--accent)",
        description: "Direct integration with the broader community. Access Famio for social networking and iSkylar for AI therapy.",
        modules: "Famio • iSkylar • Platform Sync"
    },
    {
        title: "Training Plans",
        emoji: "📅",
        color: "var(--secondary)",
        description: "AI-generated training plans tailored to your goals. Structured weekly workouts that adapt to your progress.",
        modules: "Weekly Plan • Custom AI • Progress"
    },
    {
        title: "Fasting & Metabolic",
        emoji: "⏳",
        color: "var(--accent)",
        description: "Monitor fasting windows with a visual countdown. Correlate your metabolic health with your activity data.",
        modules: "Timer • History • Metabolic Health"
    },
    {
        title: "Listen & Dictate",
        emoji: "🔊",
        color: "var(--primary)",
        description: "Standardized interactive capabilities. Listen to any activity, journal, or training plan out loud. Use your voice to dictate notes, comments, and entries with medical-grade precision.",
        modules: "TTS • STT • Hands-free"
    },
    {
        title: "Journal & Mindset",
        emoji: "📓",
        color: "var(--secondary)",
        description: "Log your thoughts and mood. AI agents help correlate your mental state with your physical output.",
        modules: "Daily Entry • AI Assistant • Insights"
    },
    {
        title: "Trash & Recovery",
        emoji: "🗑️",
        color: "var(--primary)",
        description: "Accidents happen. When you delete an item, it moves to the Trash for 30 days. You can restore it anytime during this window before it is permanently removed.",
        modules: "30-Day Recovery • Restore • Safety Net"
    },
    {
        title: "Activity Analytics",
        emoji: "📊",
        color: "var(--primary)",
        description: "Visualize your progress with interactive bar charts. Track distance and steps across varying timeframes.",
        modules: "Bar Charts • Step Tracking • Comparative Data"
    },
];

export default function LearnMorePage() {
    const { isPlaying, speak, stopSpeaking } = useVoice();

    const handleListenAll = () => {
        const textToRead = features.map(f => `${f.title}: ${f.description}`).join(". ");
        speak(`Welcome to Stride I Q Guide. ${textToRead}`);
    };

    return (
        <DashboardLayout>
            <header style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h1 style={{ fontSize: "32px", marginBottom: "5px" }}>Guide</h1>
                    <p style={{ color: "var(--foreground-muted)" }}>Everything StrideIQ can do for you.</p>
                </div>
                <SpeechControls 
                    onSpeak={handleListenAll}
                    onStopSpeaking={stopSpeaking}
                    isPlaying={isPlaying}
                    showMic={false}
                    label={isPlaying ? "Stop Guide" : "Listen to Guide"}
                />
            </header>

            {/* Voice Commands */}
            <section className="glass-panel" style={{
                padding: "25px",
                borderRadius: "var(--radius-lg)",
                marginBottom: "25px",
                borderLeft: "3px solid var(--primary)"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <h3 style={{ margin: 0 }}>🎤 Voice Commands</h3>
                    <span style={{ fontSize: "11px", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>NEW</span>
                </div>
                <p style={{ color: "var(--foreground-muted)", marginBottom: "15px", fontSize: "14px", lineHeight: 1.6 }}>
                    Control StrideIQ hands-free. Tap the microphone button and speak naturally.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                    {["\"Start a run\"", "\"Go for a walk\"", "\"Open my journal\"", "\"Sign out\""].map(cmd => (
                        <div key={cmd} style={{
                            padding: "10px 14px",
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            fontSize: "13px",
                            color: "var(--foreground-muted)",
                            fontFamily: "monospace"
                        }}>
                            <span style={{ color: "var(--primary)", marginRight: "6px" }}>›</span>
                            {cmd}
                        </div>
                    ))}
                </div>
            </section>

            {/* Feature Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px"
            }}>
                {features.map((feature) => (
                    <section key={feature.title} className="glass-panel" style={{
                        padding: "25px",
                        borderRadius: "var(--radius-lg)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{
                                width: 40, height: 40,
                                borderRadius: "var(--radius-sm)",
                                background: "rgba(255,255,255,0.05)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "20px"
                            }}>
                                {feature.emoji}
                            </div>
                            <h3 style={{ margin: 0, fontSize: "16px" }}>{feature.title}</h3>
                        </div>
                        <p style={{ color: "var(--foreground-muted)", fontSize: "14px", lineHeight: 1.5 }}>
                            {feature.description}
                        </p>
                        <div style={{
                            fontSize: "11px",
                            color: "var(--foreground-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginTop: "auto",
                            paddingTop: "10px",
                            borderTop: "1px solid rgba(255,255,255,0.05)"
                        }}>
                            {feature.modules}
                        </div>
                    </section>
                ))}
            </div>
        </DashboardLayout>
    );
}
