"use client";

import Link from "next/link";
import { useState } from "react";

export default function LearnMorePage() {
    const [activeTab, setActiveTab] = useState("ios");

    return (
        <main style={{ minHeight: "100vh", paddingBottom: "80px" }}>
            {/* Nav */}
            <nav className="glass-panel" style={{ position: "fixed", top: 0, left: 0, right: 0, padding: "20px 40px", zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link href="/" style={{ fontSize: "24px", letterSpacing: "-0.5px" }}>Stride<span className="text-gradient">IQ</span></Link>
                <div style={{ display: "flex", gap: "20px" }}>
                    <Link href="/login">Log In</Link>
                    <Link href="/signup" className="text-gradient" style={{ fontWeight: 600 }}>Get Started</Link>
                </div>
            </nav>

            {/* Hero */}
            <section style={{ paddingTop: "140px", textAlign: "center", paddingBottom: "60px", paddingLeft: "20px", paddingRight: "20px" }}>
                <h1 style={{ fontSize: "clamp(40px, 6vw, 64px)", lineHeight: 1.1, marginBottom: "20px" }}>
                    The Future of <span className="text-gradient">Agentic Fitness</span>
                </h1>
                <p style={{ fontSize: "20px", color: "var(--foreground-muted)", maxWidth: "700px", margin: "0 auto" }}>
                    StrideIQ isn't just an app. It's an intelligent system composed of autonomous agents working in harmony to optimize your performance.
                </p>
            </section>

            {/* Features Grid */}
            <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px" }}>
                <FeatureCard
                    icon="🧠"
                    title="Agentic Core"
                    desc="Our autonomous agents monitor speed, GPS accuracy, and movement patterns 10x per second to filter noise and deliver precision tracking."
                />
                <FeatureCard
                    icon="🌤"
                    title="Weather Intelligence"
                    desc="Real-time environmental scanning alerts you to dangerous heat indexes, storms, or ideal PR conditions before you step out."
                />
                <FeatureCard
                    icon="👟"
                    title="Step Dynamics"
                    desc="Advanced algorithms estimate stride count and cadence for both running and walking, helping you maintain optimal efficiency."
                />
                <FeatureCard
                    icon="🎵"
                    title="Immersive Audio"
                    desc="Context-aware audio ducking ensures coaching cues are heard clearly over your music, with BPM-matched playlists."
                />
            </section>

            {/* PWA Section */}
            <section style={{ marginTop: "100px", maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
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

function FeatureCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
    return (
        <div className="glass-panel" style={{ padding: "30px", borderRadius: "16px" }}>
            <div style={{ fontSize: "40px", marginBottom: "20px" }}>{icon}</div>
            <h3 style={{ fontSize: "24px", marginBottom: "10px" }}>{title}</h3>
            <p style={{ color: "var(--foreground-muted)", lineHeight: 1.6 }}>{desc}</p>
        </div>
    );
}
