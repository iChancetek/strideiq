"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { useVoice } from "@/hooks/useVoice";
import { useSettings } from "@/context/SettingsContext";
import { t } from "@/lib/translations";
import IQAssistant from "@/components/IQAssistant";
import { Play, Pause, Square, MessageSquare, Volume2 } from "lucide-react";

export default function LearnMorePage() {
    const [activeTab, setActiveTab] = useState("ios");
    const { settings } = useSettings();
    const { isPlaying, isPaused, speak, pauseSpeaking, resumeSpeaking, stopSpeaking } = useVoice();
    const lang = settings.language;

    const handleReadAloud = useCallback(() => {
        // Collect text content
        const heroTitle = "The World's First Agentic Fitness System";
        const heroDesc = "StrideIQ isn't just a tracker. It's a swarm of intelligent, autonomous agents working in harmony to optimize your health.";
        
        const features = [
            "Active Performance: Track every move with precision using our multi-modal activity agents.",
            "Intelligent Training: Your personal AI coach builds and adapts plans just for you.",
            "Wellness and Metabolic IQ: Elite-tier physiological tracking powered by our metabolic intelligence engine.",
            "Social Community: Connect, compete, and share with a global network of athletes.",
            "IQ Voice Assistant: Hands-free elite coaching with our conversational verbal assistant.",
            "Environmental Awareness: Your AI team watches the conditions so you can stay safe.",
            "Platform Experience: A premium, app-like experience with dynamic media coordination."
        ];

        const fullText = `${heroTitle}. ${heroDesc}. ${features.join(". ")}`;
        speak(fullText);
    }, [speak]);

    const handleAskQuestion = () => {
        // Simple way to trigger IQ Assistant context
        alert(t(lang, "askCoach") + " (IQ Assistant is active in the bottom right corner)");
    };

    return (
        <main style={{ minHeight: "100vh", paddingBottom: "80px" }}>
            {/* Nav */}
            <nav className="glass-panel" style={{ position: "fixed", top: 0, left: 0, right: 0, padding: "20px 40px", zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <Link href="/" style={{ color: "var(--foreground-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                        <span style={{ fontSize: "20px" }}>←</span> Home
                    </Link>
                    <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)" }} />
                    <Link href="/" style={{ fontSize: "24px", letterSpacing: "-0.5px" }}>Stride<span className="text-gradient">IQ</span></Link>
                </div>
                <div style={{ display: "flex", gap: "20px" }}>
                    <Link href="/login">Log In</Link>
                    <Link href="/signup" className="text-gradient" style={{ fontWeight: 600 }}>Get Started</Link>
                </div>
            </nav>

            {/* Hero */}
            <section style={{ paddingTop: "140px", textAlign: "center", paddingBottom: "60px", paddingLeft: "20px", paddingRight: "20px" }}>
                <div style={{ display: "inline-block", padding: "8px 16px", borderRadius: "20px", background: "rgba(204, 255, 0, 0.1)", color: "#CCFF00", marginBottom: "20px", fontSize: "14px", fontWeight: 600, letterSpacing: "1px" }}>
                    🚀 POWERED BY AGENTIC AI
                </div>
                <h1 style={{ fontSize: "clamp(40px, 6vw, 64px)", lineHeight: 1.1, marginBottom: "20px" }}>
                    {t(lang, "heroTitle")}
                </h1>
                <p style={{ fontSize: "20px", color: "var(--foreground-muted)", maxWidth: "800px", margin: "0 auto", lineHeight: 1.6 }}>
                    {t(lang, "heroSubtitle")}
                </p>
            </section>

            {/* Feature Sections */}
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px", display: "flex", flexDirection: "column", gap: "100px" }}>

                {/* 1. Active Performance */}
                <Section
                    title="Active Performance"
                    desc="Track every move with precision using our multi-modal activity agents."
                >
                    <FeatureCard icon="🏃" title="Multi-Sport Tracking" desc="Specialized modes for Running, Walking, Biking, and HIIT workouts." />
                    <FeatureCard icon="👟" title="Step Dynamics" desc="Advanced algorithms estimate stride count and cadence for optimal efficiency." />
                    <FeatureCard icon="📊" title="Live Telemetry" desc="Real-time monitoring of pace, distance, heart rate zones, and calorie burn." />
                </Section>

                {/* 2. Intelligent Training */}
                <Section
                    title="Intelligent Training"
                    desc="Your personal AI coach builds and adapts plans just for you."
                >
                    <FeatureCard icon="📅" title="Adaptive Plans" desc="Generate custom 8-16 week training schedules for 5Ks, Marathons, and more." />
                    <FeatureCard icon="🤖" title="AI Coach" desc="Get real-time audio cues and post-workout analysis from your digital coach." />
                    <FeatureCard icon="📈" title="Progress Analytics" desc="Visual insights into your training load, consistency, and performance trends." />
                </Section>

                {/* 3. Wellness & Metabolic IQ */}
                <Section
                    title={t(lang, "fastingStageTitle")}
                    desc={t(lang, "fastingStageDesc")}
                >
                    <FeatureCard icon="⏳" title="Fasting Stage Tracking" desc="Real-time tracking of Insulin levels, Ketosis, and Autophagy cycles as you fast." />
                    <FeatureCard icon="🧬" title="Physiological Insights" desc="Understand what's happening to your body (cellular cleanup, HGH boost) at every hour." />
                    <FeatureCard icon="🔥" title="Metabolic Analysis" desc="Automatic fat oxidation and cardiovascular stress estimation for all workouts." />
                </Section>


                {/* 4. Social Community */}
                <Section
                    title="Social Community"
                    desc="Connect, compete, and share with a global network of athletes."
                >
                    <FeatureCard icon="👥" title="Friends System" desc="Follow friends, view their activities, and stay motivated together." />
                    <FeatureCard icon="🏆" title="Leaderboards" desc="Compete on weekly Distance and Step leaderboards for top rankings." />
                    <FeatureCard icon="💬" title="Social Feed" desc="Share photos/videos and comment on activities in real-time." />
                </Section>

                {/* 5. IQ Voice Assistant */}
                <Section
                    title="IQ Voice Assistant"
                    desc="Hands-free elite coaching with our conversational verbal assistant."
                >
                    <FeatureCard icon="🎙️" title="Verbal Feedback" desc="IQ talks back to you, confirming your commands and providing status updates out loud." />
                    <FeatureCard icon="🤖" title="Intelligent Intents" desc="Command 'Start 18h fast' or 'Pause run' and stay focused on your performance." />
                    <FeatureCard icon="🧠" title="Cognitive Control" desc="Open journals, search stats, or log hydration using only your voice." />
                </Section>


                {/* 6. Environmental Awareness */}
                <Section
                    title="Environmental Awareness"
                    desc="Your AI team watches the conditions so you can stay safe."
                >
                    <FeatureCard icon="🌡️" title="Weather Adaptation" desc="Get real-time alerts for extreme heat, low humidity, or incoming storms." />
                    <FeatureCard icon="🗺️" title="Route Intelligence" desc="Agents analyze terrain and elevation to adjust your pace targets dynamically." />
                    <FeatureCard icon="☀️" title="Safety Alerts" desc="Smart reminders for hydration and UV protection based on your local exposure." />
                </Section>

                {/* 7. Platform Experience */}
                <Section
                    title="Platform Experience"
                    desc="A premium, app-like experience with dynamic media coordination."
                >
                    <FeatureCard icon="🎵" title="Media Coordination" desc="BPM-matched music suggestions and smart audio ducking during coaching prompts." />
                    <FeatureCard icon="🌓" title="Dark & Light Mode" desc="Beautifully designed themes that adapt to your environment and preference." />
                    <FeatureCard icon="📱" title="Installable PWA" desc="Install StrideIQ directly to your home screen on iOS, Android, and Desktop." />
                </Section>

            </div>

            {/* PWA Install Instructions */}
            <section style={{ marginTop: "120px", maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
                <h2 style={{ fontSize: "40px", textAlign: "center", marginBottom: "40px" }}>Install StrideIQ Everywhere</h2>
                <div className="glass-panel" style={{ padding: "40px", borderRadius: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "40px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "20px" }}>
                        {["ios", "android", "desktop"].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    background: activeTab === tab ? "rgba(255,255,255,0.1)" : "transparent",
                                    color: activeTab === tab ? "#fff" : "var(--foreground-muted)",
                                    border: "none",
                                    padding: "10px 20px",
                                    borderRadius: "20px",
                                    fontSize: "16px",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                            >
                                {tab === "ios" ? "iOS / iPhone" : tab === "android" ? "Android" : "Desktop (Mac/PC)"}
                            </button>
                        ))}
                    </div>

                    <div style={{ textAlign: "center" }}>
                        {activeTab === "ios" && (
                            <div>
                                <h3 style={{ fontSize: "24px", marginBottom: "20px" }}>Install on iPhone</h3>
                                <div style={{ display: "inline-block", textAlign: "left", lineHeight: "2" }}>
                                    <p>1. Open <strong>StrideIQ</strong> in Safari.</p>
                                    <p>2. Tap the <strong>Share</strong> icon (square with arrow up).</p>
                                    <p>3. Scroll down and tap <strong>"Add to Home Screen"</strong>.</p>
                                    <p>4. Tap <strong>Add</strong> in the top right corner.</p>
                                </div>
                            </div>
                        )}
                        {activeTab === "android" && (
                            <div>
                                <h3 style={{ fontSize: "24px", marginBottom: "20px" }}>Install on Android</h3>
                                <div style={{ display: "inline-block", textAlign: "left", lineHeight: "2" }}>
                                    <p>1. Open <strong>StrideIQ</strong> in Chrome.</p>
                                    <p>2. Tap the <strong>Menu</strong> icon (three dots).</p>
                                    <p>3. Tap <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.</p>
                                    <p>4. Confirm by tapping <strong>Install</strong>.</p>
                                </div>
                            </div>
                        )}
                        {activeTab === "desktop" && (
                            <div>
                                <h3 style={{ fontSize: "24px", marginBottom: "20px" }}>Install on Desktop</h3>
                                <div style={{ display: "inline-block", textAlign: "left", lineHeight: "2" }}>
                                    <p>1. Open <strong>StrideIQ</strong> in Chrome or Edge.</p>
                                    <p>2. Look for the <strong>Install icon</strong> (monitor with down arrow) in the address bar.</p>
                                    <p>3. Click it and select <strong>Install</strong>.</p>
                                    <p>4. StrideIQ will launch in its own window.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Floating TTS & Q&A Controls */}
            <div style={{
                position: "fixed",
                bottom: "30px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 24px",
                borderRadius: "var(--radius-full)",
                background: "rgba(18, 18, 18, 0.85)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            }}>
                <div style={{ marginRight: "8px", borderRight: "1px solid rgba(255, 255, 255, 0.1)", paddingRight: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <Volume2 size={18} color="var(--primary)" />
                    <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.5px", color: "var(--foreground-muted)" }}>READ ALOUD</span>
                </div>

                {!isPlaying && !isPaused && (
                    <button onClick={handleReadAloud} className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px", height: "36px" }}>
                        <Play size={14} fill="currentColor" /> Play
                    </button>
                )}

                {isPlaying && (
                    <button onClick={pauseSpeaking} className="btn-ghost" style={{ padding: "8px 16px", fontSize: "13px", height: "36px", background: "rgba(255,255,255,0.05)" }}>
                        <Pause size={14} fill="currentColor" /> Pause
                    </button>
                )}

                {isPaused && (
                    <button onClick={resumeSpeaking} className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px", height: "36px" }}>
                        <Play size={14} fill="currentColor" /> Resume
                    </button>
                )}

                {(isPlaying || isPaused) && (
                    <button onClick={stopSpeaking} style={{ background: "rgba(255, 50, 50, 0.15)", border: "1px solid rgba(255, 50, 50, 0.3)", color: "#ff4444", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <Square size={14} fill="currentColor" />
                    </button>
                )}

                <div style={{ width: "1px", height: "24px", background: "rgba(255, 255, 255, 0.1)", margin: "0 8px" }} />

                <button onClick={handleAskQuestion} className="btn-ghost" style={{ padding: "8px 16px", fontSize: "13px", height: "36px", borderColor: "var(--secondary)", color: "var(--secondary)" }}>
                    <MessageSquare size={14} /> Ask IQ
                </button>
            </div>

            <IQAssistant />
        </main>
    );
}

function Section({ title, desc, children }: { title: string, desc: string, children: React.ReactNode }) {
    return (
        <section>
            <div style={{ marginBottom: "30px", paddingLeft: "10px", borderLeft: "4px solid var(--primary)" }}>
                <h2 style={{ fontSize: "32px", marginBottom: "10px" }}>{title}</h2>
                <p style={{ fontSize: "18px", color: "var(--foreground-muted)" }}>{desc}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                {children}
            </div>
        </section>
    );
}

function FeatureCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
    return (
        <div className="glass-panel" style={{ padding: "30px", borderRadius: "16px", height: "100%" }}>
            <div style={{ fontSize: "40px", marginBottom: "20px" }}>{icon}</div>
            <h3 style={{ fontSize: "24px", marginBottom: "10px" }}>{title}</h3>
            <p style={{ color: "var(--foreground-muted)", lineHeight: 1.6 }}>{desc}</p>
        </div>
    );
}
