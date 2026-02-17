import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <nav className="glass-panel" style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        padding: "20px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h1 style={{ fontSize: "24px", letterSpacing: "-0.5px" }}>
            Stride<span className="text-gradient">IQ</span>
          </h1>
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link href="/login" style={{ fontWeight: 500, opacity: 0.8 }}>Log In</Link>
          <Link href="/signup" className="text-gradient" style={{ fontWeight: 600 }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "0 20px",
        background: "radial-gradient(circle at center, rgba(0, 229, 255, 0.1) 0%, rgba(5, 5, 5, 0) 70%)"
      }}>
        <h1 style={{ fontSize: "clamp(40px, 8vw, 80px)", lineHeight: 1.1, marginBottom: "20px" }}>
          Run Smarter.<br />
          <span className="text-gradient">Train Harder.</span>
        </h1>
        <p style={{
          fontSize: "clamp(18px, 4vw, 24px)",
          color: "var(--foreground-muted)",
          maxWidth: "700px",
          marginBottom: "40px"
        }}>
          The first AI-adaptive running coach that combines elite performance tracking with mindfulness.
        </p>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/signup" className="btn-primary" style={{ padding: "16px 48px", fontSize: "18px" }}>
            Start Training
          </Link>
          <button className="glass-panel" style={{
            padding: "16px 32px",
            borderRadius: "var(--radius-full)",
            color: "white",
            fontSize: "18px",
            fontFamily: "var(--font-heading)",
            cursor: "pointer"
          }}>
            Watch Demo
          </button>
        </div>
      </section>

      {/* Value Props */}
      <section style={{ padding: "100px 20px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        <h2 style={{ fontSize: "40px", marginBottom: "60px", textAlign: "center" }}>
          Why StrideIQ?
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "30px"
        }}>
          {/* Feature 1 */}
          <div className="glass-panel" style={{ padding: "40px", borderRadius: "var(--radius-lg)" }}>
            <h3 style={{ fontSize: "24px", marginBottom: "10px", color: "var(--primary)" }}>AI Coaching</h3>
            <p style={{ color: "var(--foreground-muted)", lineHeight: 1.6 }}>
              Real-time pace adjustments and training plans that adapt to your fatigue and progress.
            </p>
          </div>
          {/* Feature 2 */}
          <div className="glass-panel" style={{ padding: "40px", borderRadius: "var(--radius-lg)" }}>
            <h3 style={{ fontSize: "24px", marginBottom: "10px", color: "var(--secondary)" }}>Advanced Analytics</h3>
            <p style={{ color: "var(--foreground-muted)", lineHeight: 1.6 }}>
              Deep dive into your cadence, stride length, and heart rate zones with elite-level precision.
            </p>
          </div>
          {/* Feature 3 */}
          <div className="glass-panel" style={{ padding: "40px", borderRadius: "var(--radius-lg)" }}>
            <h3 style={{ fontSize: "24px", marginBottom: "10px", color: "var(--accent)" }}>Mindful Movement</h3>
            <p style={{ color: "var(--foreground-muted)", lineHeight: 1.6 }}>
              Integrated guided meditations and breathwork to keep your mind as strong as your legs.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "40px 20px",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        textAlign: "center",
        color: "var(--foreground-muted)"
      }}>
        <p>© 2026 StrideIQ by ChanceTEK. All rights reserved.</p>
      </footer>
    </main>
  );
}
