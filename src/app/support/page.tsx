"use client";

import Link from "next/link";
import { useState } from "react";

export default function SupportPage() {
    return (
        <main style={{ minHeight: "100vh", paddingBottom: "100px" }}>
            {/* Header Nav */}
            <nav className="glass-panel" style={{ position: "fixed", top: 0, left: 0, right: 0, padding: "20px 40px", zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link href="/dashboard" style={{ fontSize: "24px", letterSpacing: "-0.5px" }}>Stride<span className="text-gradient">IQ</span></Link>
                <div style={{ display: "flex", gap: "20px" }}>
                    <Link href="/login" style={{ color: "var(--foreground-muted)" }}>Log In</Link>
                    <Link href="/signup" className="text-gradient" style={{ fontWeight: 600 }}>Get Started</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{ paddingTop: "140px", textAlign: "center", paddingBottom: "60px", paddingLeft: "20px", paddingRight: "20px" }}>
                <div style={{ display: "inline-block", padding: "8px 16px", borderRadius: "20px", background: "rgba(204, 255, 0, 0.1)", color: "#CCFF00", marginBottom: "20px", fontSize: "14px", fontWeight: 600, letterSpacing: "1px" }}>
                    ELITE ASSISTANCE
                </div>
                <h1 style={{ fontSize: "clamp(40px, 6vw, 64px)", lineHeight: 1.1, marginBottom: "20px" }}>
                    Support <span className="text-gradient">Center</span>
                </h1>
                <p style={{ fontSize: "18px", color: "var(--foreground-muted)", maxWidth: "700px", margin: "0 auto", lineHeight: 1.6 }}>
                    Need help optimizing your StrideIQ experience? Our mission control is active 24/7 to ensure your training never stops.
                </p>
            </section>

            {/* Support Content */}
            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 20px", display: "flex", flexDirection: "column", gap: "80px" }}>
                
                <Section 
                    title="Get in Touch" 
                    desc="Connect with our human or AI support agents for technical assistance."
                >
                    <SupportCard 
                        icon="📧" 
                        title="Email Support" 
                        desc="For complex troubleshooting or account inquiries. Response time < 12h." 
                        link="mailto:support@strideiq.fit"
                        linkText="support@strideiq.fit"
                    />
                    <SupportCard 
                        icon="🤖" 
                        title="AI Help Agent" 
                        desc="Chat with our intelligent support agent for instant feature guides and tips." 
                        link="/dashboard/ai-coach"
                        linkText="Ask the Coach"
                    />
                    <SupportCard 
                        icon="🌐" 
                        title="Community Feed" 
                        desc="Ask the global StrideIQ family for training tips and community support." 
                        link="/dashboard"
                        linkText="Join the Feed"
                    />
                </Section>

                <Section 
                    title="Knowledge Base" 
                    desc="Deep dives into the StrideIQ engine and how to master our autonomous agents."
                >
                    <SupportCard 
                        icon="📖" 
                        title="User Guide" 
                        desc="Comprehensive documentation on GPS tracking, AI coaching, and data sync." 
                        link="/learn-more"
                        linkText="Read Manual"
                    />
                    <SupportCard 
                        icon="⚙️" 
                        title="Setup PWA" 
                        desc="Learn how to install StrideIQ as a professional app on your homescreen." 
                        link="/learn-more"
                        linkText="Installation Guide"
                    />
                </Section>

                <Section 
                    title="Technical FAQ" 
                    desc="Quick answers to the most common tactical questions."
                >
                    <div className="glass-panel" style={{ padding: "40px", borderRadius: "24px" }}>
                        <FAQItem 
                            q="Is my data shared with other apps?" 
                            a="No. StrideIQ data stays within our secure cloud unless you explicitly use our upcoming export features." 
                        />
                        <FAQItem 
                            q="What happens if I lose GPS signal?" 
                            a="Our movement agents use dead-reckoning and cadence data to estimate your pace until signal is restored." 
                        />
                        <FAQItem 
                            q="How do I promote to Admin?" 
                            a="Admin status is reserved for project operators. If you are a developer, check the README in the repository." 
                        />
                        <FAQItem 
                            q="Does the AI Coach work offline?" 
                            a="Basic telemetry works offline, but AI-powered voice coaching and summary generation require a connection." 
                        />
                    </div>
                </Section>

            </div>

            {/* Footer Action */}
            <div style={{ marginTop: "100px", textAlign: "center" }}>
                <Link href="/dashboard" className="btn-primary" style={{ display: "inline-flex", padding: "12px 40px" }}>
                    Mission Control Dashboard
                </Link>
            </div>
        </main>
    );
}

function Section({ title, desc, children }: { title: string, desc: string, children: React.ReactNode }) {
    return (
        <section>
            <div style={{ marginBottom: "30px", borderLeft: "4px solid var(--primary)", paddingLeft: "20px" }}>
                <h2 style={{ fontSize: "28px", marginBottom: "8px" }}>{title}</h2>
                <p style={{ color: "var(--foreground-muted)", fontSize: "16px" }}>{desc}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                {children}
            </div>
        </section>
    );
}

function SupportCard({ icon, title, desc, link, linkText }: { icon: string, title: string, desc: string, link: string, linkText: string }) {
    return (
        <div className="glass-panel" style={{ padding: "30px", borderRadius: "20px", display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ fontSize: "32px", marginBottom: "15px" }}>{icon}</div>
            <h3 style={{ fontSize: "20px", marginBottom: "10px", fontWeight: 700 }}>{title}</h3>
            <p style={{ color: "var(--foreground-muted)", lineHeight: 1.6, fontSize: "14px", flex: 1, marginBottom: "20px" }}>{desc}</p>
            <Link href={link} className="text-gradient" style={{ fontWeight: 600, textDecoration: "none", fontSize: "14px" }}>
                {linkText} →
            </Link>
        </div>
    );
}

function FAQItem({ q, a }: { q: string, a: string }) {
    return (
        <div style={{ marginBottom: "25px", paddingBottom: "25px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <h4 style={{ color: "#fff", marginBottom: "10px", fontSize: "18px" }}>{q}</h4>
            <p style={{ color: "var(--foreground-muted)", fontSize: "15px", lineHeight: 1.6 }}>{a}</p>
        </div>
    );
}
