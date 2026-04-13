"use client";

import Link from "next/link";
import { useState } from "react";

export default function LearnMorePage() {
    const [activeTab, setActiveTab] = useState("ios");

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
                    The World's First <br />
                    <span className="text-gradient">Agentic Fitness System</span>
                </h1>
                <p style={{ fontSize: "20px", color: "var(--foreground-muted)", maxWidth: "800px", margin: "0 auto", lineHeight: 1.6 }}>
                    StrideIQ isn't just a tracker. It's a swarm of <strong>intelligent, autonomous agents</strong> working in harmony to optimize your health. From real-time coaching to predictive recovery, your AI team is always active.
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

                {/* 3. Wellness & Recovery */}
                <Section
                    title="Wellness & Recovery"
                    desc="Balance your effort with deep recovery tools managed by wellness agents."
                >
                    <FeatureCard icon="🧘" title="Meditation" desc="Guided sessions for Deep Focus, Sleep Aid, and Post-Run Recovery." />
                    <FeatureCard icon="⏳" title="Fasting Tracker" desc="Seamless 16:8 and custom fasting timers with cloud synchronization." />
                    <FeatureCard icon="📓" title="Cognitive Journal" desc="AI-assisted journaling with grammar fix, tone adjustment, and media support." />
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

                {/* 5. Multimodal Intelligence */}
                <Section
                    title="Multimodal Intelligence"
                    desc="GPT-5.2 powered perception for elite form and health analysis."
                >
                    <FeatureCard icon="👁️" title="Visual Form Analysis" desc="Upload workout videos for frame-by-frame posture and biomechanical feedback." />
                    <FeatureCard icon="📸" title="Metabolic Logs" desc="AI recognizes food and supplements from photos to estimate caloric and macro load." />
                    <FeatureCard icon="🧠" title="Context Awareness" desc="Agents perceive if you are training indoors or outdoors and adjust tracking modes." />
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
