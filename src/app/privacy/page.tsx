"use client";

import Link from "next/link";

export default function PrivacyPage() {
    return (
        <main style={{ minHeight: "100vh", paddingBottom: "100px" }}>
            {/* Header Nav */}
            <nav className="glass-panel" style={{ position: "fixed", top: 0, left: 0, right: 0, padding: "20px 40px", zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <Link href="/" style={{ color: "var(--foreground-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                        <span style={{ fontSize: "20px" }}>←</span> Home
                    </Link>
                    <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)" }} />
                    <Link href="/dashboard" style={{ fontSize: "24px", letterSpacing: "-0.5px" }}>Stride<span className="text-gradient">IQ</span></Link>
                </div>
                <div style={{ display: "flex", gap: "20px" }}>
                    <Link href="/login" style={{ color: "var(--foreground-muted)" }}>Log In</Link>
                    <Link href="/signup" className="text-gradient" style={{ fontWeight: 600 }}>Get Started</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{ paddingTop: "140px", textAlign: "center", paddingBottom: "60px", paddingLeft: "20px", paddingRight: "20px" }}>
                <div style={{ display: "inline-block", padding: "8px 16px", borderRadius: "20px", background: "rgba(204, 255, 0, 0.1)", color: "#CCFF00", marginBottom: "20px", fontSize: "14px", fontWeight: 600, letterSpacing: "1px" }}>
                    DATA PROTECTION
                </div>
                <h1 style={{ fontSize: "clamp(40px, 6vw, 64px)", lineHeight: 1.1, marginBottom: "20px" }}>
                    Privacy <span className="text-gradient">Policy</span>
                </h1>
                <p style={{ fontSize: "18px", color: "var(--foreground-muted)", maxWidth: "700px", margin: "0 auto", lineHeight: 1.6 }}>
                    Your fitness data is sacred. We use state-of-the-art encryption and transparent policies to keep your information secure and under your control.
                </p>
                <p style={{ marginTop: "20px", fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>Last Updated: April 12, 2026</p>
            </section>

            {/* Privacy Content */}
            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 20px", display: "flex", flexDirection: "column", gap: "80px" }}>
                
                <Section 
                    title="Information Gathering" 
                    desc="We only collect data that directly contributes to your training performance and health insights."
                >
                    <PrivacyCard 
                        icon="📍" 
                        title="Telemetry Data" 
                        desc="GPS coordinates, altitude, and pace are processed to generate your performance metrics and route maps." 
                    />
                    <PrivacyCard 
                        icon="💓" 
                        title="Vitals & Health" 
                        desc="Step counts and health metadata are synced to provide context for your AI coach's recovery recommendations." 
                    />
                    <PrivacyCard 
                        icon="📧" 
                        title="Account Info" 
                        desc="Your email and display name are used for account management and social interactions within the community." 
                    />
                </Section>

                <Section 
                    title="Data Integrity" 
                    desc="We operate on a 'privacy-by-design' principle. Your data is not a product."
                >
                    <PrivacyCard 
                        icon="🛡️" 
                        title="Zero Data Sales" 
                        desc="StrideIQ does NOT sell your personal health data to advertisers or third-party marketplaces. Ever." 
                    />
                    <PrivacyCard 
                        icon="🔐" 
                        title="Elite Security" 
                        desc="All data transitions are encrypted via TLS, and stored in hardened Google Firebase cloud environments." 
                    />
                    <PrivacyCard 
                        icon="🧠" 
                        title="AI Privacy" 
                        desc="Personal data processed by our AI agents is used purely for pattern recognition to improve your training plans." 
                    />
                </Section>

                <Section 
                    title="Your Ownership" 
                    desc="You have complete authority over your digital footprint on the StrideIQ platform."
                >
                    <PrivacyCard 
                        icon="🗑️" 
                        title="Right to Erase" 
                        desc="You can delete your account and all associated workout history directly from your settings dashboard." 
                    />
                    <PrivacyCard 
                        icon="📥" 
                        title="Data Portability" 
                        desc="Export your workout logs and metrics whenever you need them for external analysis." 
                    />
                </Section>

            </div>

            {/* Footer Action */}
            <div style={{ marginTop: "100px", textAlign: "center" }}>
                <Link href="/dashboard" className="btn-primary" style={{ display: "inline-flex", padding: "12px 40px" }}>
                    Return to Dashboard
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

function PrivacyCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
    return (
        <div className="glass-panel" style={{ padding: "30px", borderRadius: "20px" }}>
            <div style={{ fontSize: "32px", marginBottom: "15px" }}>{icon}</div>
            <h3 style={{ fontSize: "20px", marginBottom: "10px", fontWeight: 700 }}>{title}</h3>
            <p style={{ color: "var(--foreground-muted)", lineHeight: 1.6, fontSize: "14px" }}>{desc}</p>
        </div>
    );
}
