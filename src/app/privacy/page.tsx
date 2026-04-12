"use client";

import Link from "next/link";

export default function PrivacyPage() {
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
                <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>Privacy Policy</h1>
                <p style={{ color: "var(--foreground-muted)", marginBottom: "40px" }}>Your privacy is our priority.</p>

                <div className="glass-panel" style={{ padding: "40px", borderRadius: "24px", lineHeight: "1.8", color: "var(--foreground-muted)" }}>
                    <h2 style={{ color: "#fff", marginTop: "0" }}>1. Information We Collect</h2>
                    <p>We collect information you provide directly to us, such as your name, email, and fitness data (GPS coordinates, step counts, activity logs).</p>

                    <h2 style={{ color: "#fff" }}>2. How We Use Information</h2>
                    <p>Your data is used to provide AI coaching, track progress, and improve our algorithms. We do **not** sell your personal data to third parties.</p>

                    <h2 style={{ color: "#fff" }}>3. Data Storage & Security</h2>
                    <p>We use industry-standard encryption and secure cloud providers (Google Firebase) to protect your data. However, no method of transmission over the internet is 100% secure.</p>

                    <h2 style={{ color: "#fff" }}>4. Your Rights</h2>
                    <p>You have the right to access, correct, or delete your personal information at any time via your account settings.</p>

                    <h2 style={{ color: "#fff" }}>5. Cookies</h2>
                    <p>We use cookies to maintain your session and remember your preferences (like Dark/Light mode).</p>

                    <h2 style={{ color: "#fff" }}>6. Changes to This Policy</h2>
                    <p>We may update this policy periodically. We will notify you of any significant changes via email or platform announcements.</p>
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
