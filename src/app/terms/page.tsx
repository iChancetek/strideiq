"use client";

import Link from "next/link";

export default function TermsPage() {
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
                    LEGAL FRAMEWORK
                </div>
                <h1 style={{ fontSize: "clamp(40px, 6vw, 64px)", lineHeight: 1.1, marginBottom: "20px" }}>
                    Terms of <span className="text-gradient">Service</span>
                </h1>
                <p style={{ fontSize: "18px", color: "var(--foreground-muted)", maxWidth: "700px", margin: "0 auto", lineHeight: 1.6 }}>
                    Our terms are designed to create a safe, transparent, and high-performance environment for every athlete on the StrideIQ platform.
                </p>
                <p style={{ marginTop: "20px", fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>Last Updated: April 12, 2026</p>
            </section>

            {/* Terms Content */}
            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 20px", display: "flex", flexDirection: "column", gap: "80px" }}>
                
                <Section 
                    title="User Agreement" 
                    desc="By accessing StrideIQ, you enter into a binding agreement to maintain the integrity of the community."
                >
                    <InfoCard 
                        icon="🤝" 
                        title="Acceptance" 
                        desc="Using our dashboard, AI coaching, or social features constitutes a full acceptance of these terms and conditions." 
                    />
                    <InfoCard 
                        icon="👤" 
                        title="Eligibility" 
                        desc="You must be at least 13 years old to create an account. Professional athletes must comply with their specific league regulations." 
                    />
                </Section>

                <Section 
                    title="Platform Usage" 
                    desc="We provide elite tools, and we expect elite conduct from our members."
                >
                    <InfoCard 
                        icon="🚀" 
                        title="Service Scope" 
                        desc="We reserve the right to upgrade, modify, or pivot features to ensure the StrideIQ engine remains state-of-the-art." 
                    />
                    <InfoCard 
                        icon="🚫" 
                        title="Prohibited Acts" 
                        desc="No data scraping, unauthorized API access, or harassment within the social feed is permitted." 
                    />
                    <InfoCard 
                        icon="🛡️" 
                        title="Account Security" 
                        desc="You are the sole guardian of your credentials. StrideIQ is not liable for losses resulting from shared passwords." 
                    />
                </Section>

                <Section 
                    title="Liability & Safety" 
                    desc="Your health is paramount. Use our AI recommendations as a guide, not a medical mandate."
                >
                    <InfoCard 
                        icon="🏥" 
                        title="Medical Disclaimer" 
                        desc="Consult with a physician before starting any training plan. AI coaching is based on data, not clinical diagnosis." 
                    />
                    <InfoCard 
                        icon="⚖️" 
                        title="Limit of Liability" 
                        desc="StrideIQ is provided 'as is'. We are not responsible for physical injury or indirect damages arising from platform use." 
                    />
                </Section>

            </div>

            {/* Footer Action */}
            <div style={{ marginTop: "100px", textAlign: "center" }}>
                <Link href="/dashboard" className="btn-primary" style={{ display: "inline-flex", padding: "12px 40px" }}>
                    Back to Control Center
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

function InfoCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
    return (
        <div className="glass-panel" style={{ padding: "30px", borderRadius: "20px" }}>
            <div style={{ fontSize: "32px", marginBottom: "15px" }}>{icon}</div>
            <h3 style={{ fontSize: "20px", marginBottom: "10px", fontWeight: 700 }}>{title}</h3>
            <p style={{ color: "var(--foreground-muted)", lineHeight: 1.6, fontSize: "14px" }}>{desc}</p>
        </div>
    );
}
