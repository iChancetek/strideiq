"use client";

import Link from "next/link";

export default function TermsPage() {
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
                <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>Terms of Service</h1>
                <p style={{ color: "var(--foreground-muted)", marginBottom: "40px" }}>Last Updated: April 12, 2026</p>

                <div className="glass-panel" style={{ padding: "40px", borderRadius: "24px", lineHeight: "1.8", color: "var(--foreground-muted)" }}>
                    <h2 style={{ color: "#fff", marginTop: "0" }}>1. Acceptance of Terms</h2>
                    <p>By accessing or using StrideIQ, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.</p>

                    <h2 style={{ color: "#fff" }}>2. Description of Service</h2>
                    <p>StrideIQ provides an AI-powered fitness tracking and coaching platform. We reserve the right to modify or discontinue services at any time.</p>

                    <h2 style={{ color: "#fff" }}>3. User Accounts</h2>
                    <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information when creating an account.</p>

                    <h2 style={{ color: "#fff" }}>4. Prohibited Conduct</h2>
                    <p>You agree not to use the service for any illegal purposes or to interfere with the operation of the platform.</p>

                    <h2 style={{ color: "#fff" }}>5. Limitation of Liability</h2>
                    <p>StrideIQ is provided "as is". We are not liable for any injuries, data loss, or damages resulting from the use of our fitness recommendations.</p>

                    <h2 style={{ color: "#fff" }}>6. Termination</h2>
                    <p>We may terminate or suspend your account at our discretion, without prior notice, for conduct that violates these terms.</p>
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
