"use client";

import Link from "next/link";

export default function SupportPage() {
    return (
        <main style={{ minHeight: "100vh", paddingBottom: "100px" }}>
            {/* Header Nav */}
            <nav className="glass-panel" style={{ position: "fixed", top: 0, left: 0, right: 0, padding: "20px 40px", zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link href="/" style={{ fontSize: "24px", letterSpacing: "-0.5px" }}>Stride<span className="text-gradient">IQ</span></Link>
                <div style={{ display: "flex", gap: "20px" }}>
                    <Link href="/login" style={{ color: "var(--foreground-muted)" }}>Log In</Link>
                    <Link href="/signup" className="text-gradient" style={{ fontWeight: 600 }}>Get Started</Link>
                </div>
            </nav>

            <div style={{ maxWidth: "800px", margin: "0 auto", paddingTop: "140px", paddingLeft: "20px", paddingRight: "20px" }}>
                <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>Support Center</h1>
                <p style={{ color: "var(--foreground-muted)", marginBottom: "40px" }}>How can we help you today?</p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                    <div className="glass-panel" style={{ padding: "30px", borderRadius: "16px", textAlign: "center" }}>
                        <div style={{ fontSize: "40px", marginBottom: "15px" }}>📧</div>
                        <h3 style={{ marginBottom: "10px" }}>Email Support</h3>
                        <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "20px" }}>Get a response within 24 hours.</p>
                        <a href="mailto:support@strideiq.fit" className="text-gradient" style={{ fontWeight: 600, textDecoration: "none" }}>support@strideiq.fit</a>
                    </div>
                   <div className="glass-panel" style={{ padding: "30px", borderRadius: "16px", textAlign: "center" }}>
                        <div style={{ fontSize: "40px", marginBottom: "15px" }}>📚</div>
                        <h3 style={{ marginBottom: "10px" }}>Documentation</h3>
                        <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "20px" }}>Learn how to use every feature.</p>
                        <Link href="/learn-more" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Browse Guide</Link>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: "40px", borderRadius: "24px" }}>
                    <h2 style={{ marginBottom: "20px" }}>Frequently Asked Questions</h2>
                    <FAQItem 
                        q="Is StrideIQ free to use?" 
                        a="Yes! StrideIQ is currently free for all users while in early access." 
                    />
                    <FAQItem 
                        q="How do I install the PWA?" 
                        a="Check our 'Learn More' page for step-by-step instructions for iOS, Android, and Desktop." 
                    />
                    <FAQItem 
                        q="Can I sync my data across devices?" 
                        a="Absolutely. Your data is synced to the StrideIQ cloud in real-time." 
                    />
                </div>

                <div style={{ marginTop: "40px", textAlign: "center" }}>
                    <Link href="/" className="btn-primary" style={{ display: "inline-flex", padding: "12px 30px" }}>
                        Back to Home
                    </Link>
                </div>
            </div>
        </main>
    );
}

function FAQItem({ q, a }: { q: string, a: string }) {
    return (
        <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <h4 style={{ color: "#fff", marginBottom: "10px" }}>{q}</h4>
            <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>{a}</p>
        </div>
    );
}
