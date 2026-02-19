"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

const features = [
    {
        title: "Activity Tracking",
        emoji: "🏃",
        color: "var(--primary)",
        description: "Track runs, walks, and bike rides with GPS, pace, and elevation. Real-time stats with automatic calorie estimates.",
        modules: "GPS • Pace • Elevation • Calories"
    },
    {
        title: "AI Performance Coach",
        emoji: "🤖",
        color: "var(--primary)",
        description: "Chat with your personal AI coach. Choose from three coaching personas: Onyx (discipline), Titan (power), or Zen (balance).",
        modules: "Chat • Voice • Personas"
    },
    {
        title: "Training Plans",
        emoji: "📅",
        color: "var(--secondary)",
        description: "AI-generated training plans tailored to your fitness level and goals. Structured weekly workouts with progressive overload.",
        modules: "Weekly Plan • Auto-Generate • Progress"
    },
    {
        title: "Fasting Tracker",
        emoji: "⏳",
        color: "var(--accent)",
        description: "Monitor your fasting windows with a visual countdown timer. Track your metabolic health alongside your fitness.",
        modules: "Timer • History • Streaks"
    },
    {
        title: "Journal",
        emoji: "📓",
        color: "var(--secondary)",
        description: "Log your thoughts, mood, and reflections. AI agents correlate your mental state with your physical performance.",
        modules: "Daily Entry • Mood • Insights"
    },
    {
        title: "Steps & Leaderboard",
        emoji: "👟",
        color: "var(--primary)",
        description: "Track daily steps and compete on global leaderboards. Every step counts toward your rank.",
        modules: "Steps • Ranking • Streaks"
    },
    {
        title: "Friends & Community",
        emoji: "👥",
        color: "var(--secondary)",
        description: "Connect with other athletes. View their activities, follow their progress, and stay motivated together.",
        modules: "Friends • Social Feed • Invite"
    },
    {
        title: "Meditation",
        emoji: "🧘",
        color: "var(--accent)",
        description: "Guided breathing exercises and meditation sessions to enhance focus, recovery, and mental clarity.",
        modules: "Breathing • Timer • Sessions"
    },
];

export default function LearnMorePage() {
    return (
        <DashboardLayout>
            <header style={{ marginBottom: "30px" }}>
                <h1 style={{ fontSize: "32px", marginBottom: "5px" }}>Guide</h1>
                <p style={{ color: "var(--foreground-muted)" }}>Everything StrideIQ can do for you.</p>
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
