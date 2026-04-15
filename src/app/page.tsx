"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useSettings } from "@/context/SettingsContext";
import { t } from "@/lib/translations";
import {
  Sun, Moon, Zap, Mic2, CloudSun, Music2, Activity, Home as HomeIcon, ArrowRight, ChevronDown
} from "lucide-react";
import IQAssistant from "@/components/IQAssistant";


type Agent = {
  icon: React.ReactNode;
  color: string;
  glowColor: string;
  title: string;
  description: string;
  delay: string;
};

const agents: Agent[] = [
  {
    icon: <Activity size={28} />,
    color: "var(--primary)",
    glowColor: "var(--primary-glow)",
    title: "Metabolic Intelligence",
    description:
      "Real-time physiological tracking of Autophagy, Ketosis, and Fat Oxidation. Understand exactly what's happening to your body at every hour.",
    delay: "anim-fade-up-delay-1",

  },
  {
    icon: <Mic2 size={28} />,
    color: "var(--secondary)",
    glowColor: "var(--secondary-glow)",
    title: "IQ Verbal Assistant",
    description:
      "A hands-free conversational coach that talks back. Command 'IQ, start my fast' or 'Pause run' and get instant verbal confirmation.",
    delay: "anim-fade-up-delay-2",

  },
  {
    icon: <CloudSun size={28} />,
    color: "var(--accent)",
    glowColor: "rgba(255,0,85,0.2)",
    title: "Environmental Awareness",
    description:
      "Real-time weather intelligence with safety advice. Alerts for extreme heat, rain, and storm conditions at outdoor session start.",
    delay: "anim-fade-up-delay-3",
  },
  {
    icon: <Music2 size={28} />,
    color: "var(--primary)",
    glowColor: "var(--primary-glow)",
    title: "Media Coordination",
    description:
      "Smart audio ducking during voice prompts and BPM-matched playlist suggestions tailored to your activity mode.",
    delay: "anim-fade-up-delay-4",
  },
  {
    icon: <Zap size={28} />,
    color: "var(--secondary)",
    glowColor: "var(--secondary-glow)",
    title: "Multimodal Intelligence",
    description:
      "Integrated GPT-5.2 perception for photos and videos. Get elite-level form analysis and metabolic insights from your visual logs.",
    delay: "anim-fade-up-delay-5",
  },
  {
    icon: <HomeIcon size={28} />,
    color: "var(--accent)",
    glowColor: "rgba(255,0,85,0.2)",
    title: "Indoor / Outdoor Context",
    description:
      "Seamless transition between indoor and outdoor sessions. GPS-free treadmill mode with battery optimization.",
    delay: "anim-fade-up-delay-6",
  },
];

export default function Home() {
  const { settings, toggleTheme, updateSettings } = useSettings();
  const lang = settings.language;
  const isDark = settings.theme === "dark";
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflowX: "hidden" }}>

      {/* ─── BACKGROUND ORBS ─── */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute",
          top: "-15%",
          left: "-10%",
          width: "50vw",
          height: "50vw",
          background: `radial-gradient(circle, ${isDark ? "rgba(204,255,0,0.08)" : "rgba(163,204,0,0.06)"} 0%, transparent 70%)`,
          animation: "orb-move 20s ease-in-out infinite",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute",
          top: "20%",
          right: "-15%",
          width: "45vw",
          height: "45vw",
          background: `radial-gradient(circle, ${isDark ? "rgba(0,229,255,0.06)" : "rgba(0,153,184,0.05)"} 0%, transparent 70%)`,
          animation: "orb-move 24s ease-in-out infinite reverse",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute",
          bottom: "10%",
          left: "30%",
          width: "35vw",
          height: "35vw",
          background: `radial-gradient(circle, ${isDark ? "rgba(255,0,85,0.04)" : "rgba(255,0,85,0.03)"} 0%, transparent 70%)`,
          animation: "orb-move 20s ease-in-out 5s infinite",
          borderRadius: "50%",
        }} />
      </div>

      {/* ─── NAVBAR ─── */}
      <nav
        className="glass-panel"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          padding: "0 40px",
          height: "68px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <Link href="/dashboard" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "baseline", gap: "10px" }}>
          <h1 style={{ fontSize: "22px", letterSpacing: "-0.5px", fontFamily: "var(--font-heading)", fontWeight: 800 }}>
            Stride<span className="text-gradient">IQ</span> <span style={{ fontSize: "14px", verticalAlign: "top", color: "var(--primary)" }}>ELITE</span>
          </h1>
          <span style={{ fontSize: "11px", color: "var(--foreground-muted)", fontWeight: 400, letterSpacing: "0.4px" }}>
            {t(lang, "byCTEK")}
          </span>
        </Link>

        {/* Nav Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link
            href="/login"
            style={{
              fontWeight: 500,
              fontSize: "14px",
              color: "var(--foreground-muted)",
              padding: "8px 16px",
              borderRadius: "var(--radius-full)",
              transition: "color var(--transition-fast), background var(--transition-fast)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--foreground)";
              (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface-glass)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--foreground-muted)";
              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
            }}
          >
            {t(lang, "logIn")}
          </Link>
          <Link href="/signup" className="btn-primary" style={{ padding: "10px 24px", fontSize: "14px" }}>
            {t(lang, "getStarted")}
          </Link>
          <select
            value={settings.language}
            onChange={(e) => updateSettings({ language: e.target.value as any })}
            style={{
              background: "var(--surface-glass)",
              color: "var(--foreground-muted)",
              border: "1px solid var(--surface-glass-border)",
              borderRadius: "var(--radius-full)",
              padding: "8px 12px",
              fontSize: "13px",
              outline: "none",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <option value="en">🇺🇸 EN</option>
            <option value="es">🇪🇸 ES</option>
            <option value="fr">🇫🇷 FR</option>
            <option value="de">🇩🇪 DE</option>
            <option value="it">🇮🇹 IT</option>
            <option value="pt">🇵🇹 PT</option>
            <option value="ar">🇸🇦 AR</option>
            <option value="hi">🇮🇳 HI</option>
            <option value="ja">🇯🇵 JA</option>
            <option value="zh">🇨🇳 ZH</option>
          </select>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
              marginLeft: "4px",
              width: "40px",
              height: "40px",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--surface-glass-border)",
              background: "var(--surface-glass)",
              color: "var(--foreground-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)",
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.color = "var(--foreground)";
              btn.style.borderColor = isDark ? "rgba(204,255,0,0.4)" : "rgba(0,99,140,0.3)";
            }}
            onMouseLeave={e => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.color = "var(--foreground-muted)";
              btn.style.borderColor = "var(--surface-glass-border)";
            }}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "120px 24px 80px",
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        {/* ── Video Background ── */}
        <video
          ref={videoRef}
          src="/videos/StridetIQ.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            zIndex: 0,
            opacity: 0.85,
            backgroundColor: "#000",
          }}
        />
        {/* Gradient overlay so text stays legible */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: isDark
            ? "linear-gradient(to bottom, rgba(5,5,5,0.85) 0%, rgba(5,5,5,0.2) 50%, rgba(5,5,5,0.85) 100%)"
            : "linear-gradient(to bottom, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.85) 100%)",
          zIndex: 1,
        }} />

        {/* Mute / Unmute button */}
        <button
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute video" : "Mute video"}
          style={{
            position: "absolute",
            bottom: "28px",
            right: "28px",
            zIndex: 10,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "50%",
            width: "44px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "18px",
            color: "#fff",
            transition: "background 0.2s",
          }}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>

        {/* All hero content sits above video — needs relative + z-index */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Pill label */}
          <div className="section-label anim-fade-up" style={{ animationDelay: "0s" }}>
            <Zap size={12} />
            {t(lang, "poweredBy")}
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(48px, 10vw, 100px)",
            fontWeight: 900,
            lineHeight: 0.9,
            letterSpacing: "-0.04em",
            marginBottom: "20px",
          }}>
            {t(lang, "heroTitle")}
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: "clamp(18px, 2.5vw, 24px)",
            color: "var(--foreground-muted)",
            maxWidth: "600px",
            lineHeight: 1.4,
            marginBottom: "40px",
          }}>
            {t(lang, "heroSubtitle")}
          </p>

          {/* CTAs */}
          <div
            className="anim-fade-up anim-fade-up-delay-3"
            style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center", marginBottom: "72px" }}
          >
            <Link href="/signup" className="btn-primary" style={{ padding: "16px 40px", fontSize: "16px" }}>
              {t(lang, "getStarted")}
              <ArrowRight size={18} />
            </Link>
            <Link href="/learn-more" className="btn-ghost" style={{ padding: "16px 36px", fontSize: "16px" }}>
              {t(lang, "learnMore")}
            </Link>
          </div>

          {/* Stat badges */}
          <div
            className="anim-fade-up anim-fade-up-delay-4"
            style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}
          >
            {[
              { label: "6 Autonomous Agents" },
              { label: "Real-Time Adaptation" },
              { label: "Voice AI Coaching" },
            ].map(stat => (
              <div key={stat.label} className="stat-badge" style={{ fontSize: "13px" }}>
                <span className="text-gradient" style={{ fontWeight: 700, fontSize: "15px" }}>✦</span>
                {stat.label}
              </div>
            ))}
            <div className="stat-badge" style={{ fontSize: "13px", color: "var(--primary)" }}>
              <span style={{ fontWeight: 700, fontSize: "15px" }}>✦</span>
              Multimodal gpt-5.4-mini
            </div>
          </div>
        </div>{/* end hero content wrapper */}

        {/* Scroll indicator */}
        <div
          style={{
            position: "absolute",
            bottom: "36px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            color: "var(--foreground-subtle)",
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            zIndex: 10,
          }}
        >
          <span>Scroll</span>
          <ChevronDown size={16} style={{ animation: "scroll-down 1.4s ease infinite" }} />
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div className="divider" style={{ margin: "0 8%" }} />

      {/* ─── AGENTS SECTION ─── */}
      <section
        style={{
          padding: "120px 24px",
          maxWidth: "1160px",
          margin: "0 auto",
          width: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "80px" }}>
          <div className="section-label" style={{ justifyContent: "center" }}>
            Intelligence Stack
          </div>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              marginBottom: "20px",
            }}
          >
            {t(lang, "multimodalTitle")}
          </h2>
          <p
            style={{
              color: "var(--foreground-muted)",
              fontSize: "18px",
              maxWidth: "540px",
              margin: "0 auto",
              lineHeight: 1.65,
            }}
          >
            {t(lang, "multimodalDesc")}
          </p>
        </div>

        {/* Cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {agents.map((agent) => (
            <div key={agent.title} className={`feature-card anim-fade-up ${agent.delay}`}>
              {/* Icon */}
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "var(--radius-md)",
                  background: `${agent.glowColor}`,
                  border: `1px solid ${agent.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: agent.color,
                  marginBottom: "24px",
                }}
              >
                {agent.icon}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: "19px",
                  marginBottom: "12px",
                  color: agent.color,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {agent.title}
              </h3>

              {/* Description */}
              <p style={{ color: "var(--foreground-muted)", lineHeight: 1.7, fontSize: "15px" }}>
                {agent.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          padding: "80px 24px 120px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            background: isDark
              ? "linear-gradient(135deg, rgba(204,255,0,0.06) 0%, rgba(0,229,255,0.04) 100%)"
              : "linear-gradient(135deg, rgba(139,186,0,0.07) 0%, rgba(0,153,184,0.05) 100%)",
            border: "1px solid var(--surface-glass-border)",
            borderRadius: "var(--radius-xl)",
            padding: "64px 48px",
            backdropFilter: "blur(20px)",
          }}
        >
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", marginBottom: "16px" }}>
            {t(lang, "readyToTrain")}
          </h2>
          <p style={{ color: "var(--foreground-muted)", fontSize: "17px", marginBottom: "36px", lineHeight: 1.65 }}>
            {t(lang, "joinAthletes")}
          </p>
          <Link href="/signup" className="btn-primary" style={{ padding: "16px 48px", fontSize: "16px" }}>
            {t(lang, "getStartedFree")}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer
        style={{
          position: "relative",
          zIndex: 1,
          padding: "32px 40px",
          borderTop: "1px solid var(--surface-glass-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "16px" }}>
            Stride<span className="text-gradient">IQ</span>
          </span>
          <span style={{ fontSize: "11px", color: "var(--foreground-subtle)" }}>{t(lang, "byCTEK")}</span>
        </div>
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "13px" }}>
          <Link href="/terms" style={{ color: "var(--foreground-subtle)", textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "var(--foreground-subtle)"}>Terms</Link>
          <Link href="/privacy" style={{ color: "var(--foreground-subtle)", textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "var(--foreground-subtle)"}>Privacy</Link>
          <Link href="/support" style={{ color: "var(--foreground-subtle)", textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "var(--foreground-subtle)"}>Support</Link>
          <Link href="/learn-more" style={{ color: "var(--foreground-subtle)", textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "var(--foreground-subtle)"}>Features</Link>
        </div>
        <p style={{ fontSize: "13px", color: "var(--foreground-subtle)" }}>
          {t(lang, "copyRights")}
        </p>
        <p style={{ fontSize: "12px", color: "var(--foreground-subtle)", fontStyle: "italic" }}>
          {t(lang, "tagline")}
        </p>
      </footer>
      <IQAssistant />

    </main>
  );
}
