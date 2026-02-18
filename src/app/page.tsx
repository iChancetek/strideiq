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
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <h1 style={{ fontSize: "24px", letterSpacing: "-0.5px" }}>
            Stride<span className="text-gradient">IQ</span>
          </h1>
          <span style={{ fontSize: "12px", color: "var(--foreground-muted)", fontWeight: 400, letterSpacing: "0.5px" }}>
            by ChanceTEK Fitness
          </span>
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
        <div style={{ fontSize: "14px", color: "var(--secondary)", textTransform: "uppercase", letterSpacing: "3px", marginBottom: "20px", fontWeight: 600 }}>
          Powered by Agentic AI
        </div>
        <h1 style={{ fontSize: "clamp(40px, 8vw, 80px)", lineHeight: 1.1, marginBottom: "20px" }}>
          Intelligent Movement.<br />
          <span className="text-gradient">Agentic Performance.</span>
        </h1>
        <p style={{
          fontSize: "clamp(18px, 4vw, 24px)",
          color: "var(--foreground-muted)",
          maxWidth: "700px",
          marginBottom: "40px"
        }}>
          The first AI-powered fitness platform with autonomous coaching agents that perceive your movement, adapt in real-time, and evolve with you.
        </p>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/signup" className="btn-primary" style={{ padding: "16px 48px", fontSize: "18px" }}>
            Start Training
          </Link>
          <Link href="/learn-more" className="glass-panel" style={{
            padding: "16px 32px",
            borderRadius: "var(--radius-full)",
            color: "white",
            fontSize: "18px",
            fontFamily: "var(--font-heading)",
            cursor: "pointer",
            textDecoration: "none"
          }}>
            Learn More
          </Link>
        </div>
      </section>

      {/* Value Props — AI Agents */}
      <section style={{ padding: "100px 20px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        <h2 style={{ fontSize: "40px", marginBottom: "16px", textAlign: "center" }}>
          6 Autonomous AI Agents
        </h2>
        <p style={{ textAlign: "center", color: "var(--foreground-muted)", marginBottom: "60px", maxWidth: "600px", margin: "0 auto 60px" }}>
          StrideIQ deploys a team of intelligent agents that work together to deliver a personalized, real-time coaching experience.
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "30px"
        }}>
          <div className="glass-panel" style={{ padding: "40px", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🏃</div>
            <h3 style={{ fontSize: "22px", marginBottom: "10px", color: "var(--primary)" }}>Movement Intelligence</h3>
            <p style={{ color: "var(--foreground-muted)", lineHeight: 1.6 }}>
              Detects stop/start movement using GPS + accelerometer analysis. Auto-pauses when truly stopped, prevents false pauses on hills.
            </p>
          </div>
          <div className="glass-panel" style={{ padding: "40px", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🎤</div>
            <h3 style={{ fontSize: "22px", marginBottom: "10px", color: "var(--secondary)" }}>Adaptive Coaching</h3>
            <p style={{ color: "var(--foreground-muted)", lineHeight: 1.6 }}>
              Voice announcements at every mile with split times, pace trends, and motivational encouragement that evolves based on your performance.
            </p>
          </div>
          <div className="glass-panel" style={{ padding: "40px", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🌦</div>
            <h3 style={{ fontSize: "22px", marginBottom: "10px", color: "var(--accent)" }}>Environmental Awareness</h3>
            <p style={{ color: "var(--foreground-muted)", lineHeight: 1.6 }}>
              Real-time weather intelligence with safety advice. Alerts for extreme heat, rain, and storm conditions at outdoor session start.
            </p>
          </div>
          <div className="glass-panel" style={{ padding: "40px", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🎵</div>
            <h3 style={{ fontSize: "22px", marginBottom: "10px", color: "var(--primary)" }}>Media Coordination</h3>
            <p style={{ color: "var(--foreground-muted)", lineHeight: 1.6 }}>
              Smart audio ducking during voice prompts and BPM-matched playlist suggestions tailored to your activity mode.
            </p>
          </div>
          <div className="glass-panel" style={{ padding: "40px", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🚶</div>
            <h3 style={{ fontSize: "22px", marginBottom: "10px", color: "var(--secondary)" }}>Mode Intelligence</h3>
            <p style={{ color: "var(--foreground-muted)", lineHeight: 1.6 }}>
              Automatically adjusts speed thresholds, coaching style, and display metrics for Running, Walking, and Biking modes.
            </p>
          </div>
          <div className="glass-panel" style={{ padding: "40px", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>🏠</div>
            <h3 style={{ fontSize: "22px", marginBottom: "10px", color: "var(--accent)" }}>Indoor / Outdoor Context</h3>
            <p style={{ color: "var(--foreground-muted)", lineHeight: 1.6 }}>
              Seamless transition between indoor and outdoor sessions. GPS-free treadmill mode with battery optimization.
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
        <p>© 2026 StrideIQ by ChanceTEK Fitness. All rights reserved.</p>
        <p style={{ fontSize: "12px", marginTop: "8px", opacity: 0.6 }}>Intelligent Movement. Agentic Performance.</p>
      </footer>
    </main>
  );
}
