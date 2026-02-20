"use client";

import Sidebar from "./Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { logOut } from "@/lib/firebase/auth";
import VoiceCommandOverlay from "@/components/dashboard/VoiceCommandOverlay";
import { ChevronLeft } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { t } from "@/lib/translations";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { settings } = useSettings();
  const lang = settings.language;
  const router = useRouter();
  const pathname = usePathname();
  const greetingTriggered = useRef(false);

  useEffect(() => {
    if (!loading && user && !user.emailVerified) {
      router.push("/verify-email");
    }
  }, [user, loading, router]);

  // Voice Greeting — plays ONCE per login session (sessionStorage clears on tab close)
  useEffect(() => {
    if (!loading && user && !greetingTriggered.current) {
      // Check sessionStorage — only greet once per login
      const alreadyGreeted = sessionStorage.getItem("strideiq_greeted");
      if (alreadyGreeted) return;

      greetingTriggered.current = true;
      sessionStorage.setItem("strideiq_greeted", "true");

      const name = user.displayName?.split(" ")[0] || "there";
      const hour = new Date().getHours();
      let timeGreeting = "Good morning";
      if (hour >= 12 && hour < 17) timeGreeting = "Good afternoon";
      if (hour >= 17) timeGreeting = "Good evening";

      const text = `${timeGreeting}, ${name}. Welcome back to Stride IQ! Ready to crush some goals today?`;

      // Use OpenAI TTS (nova voice) for natural sound; fallback to browser TTS
      (async () => {
        try {
          const res = await fetch("/api/ai/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
          if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.volume = 0.85;
            audio.play().catch(() => { });
            audio.onended = () => URL.revokeObjectURL(url);
            return; // Success — don't fallback
          }
        } catch (e) {
          console.warn("OpenAI TTS unavailable, falling back to browser TTS", e);
        }

        // Fallback: browser SpeechSynthesis
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(v =>
            v.name.includes("Google US English") ||
            v.name.includes("Zira") ||
            (v.name.includes("Female") && v.lang.startsWith("en"))
          );
          if (preferredVoice) utterance.voice = preferredVoice;
          utterance.rate = 1.0;
          utterance.pitch = 1.05;
          window.speechSynthesis.speak(utterance);
        }
      })();
    }
  }, [user, loading]);

  const handleLogout = async () => {
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      // Clear greeting flag so next login triggers a fresh greeting
      sessionStorage.removeItem("strideiq_greeted");
      await logOut();
      router.push("/login");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  if (loading) return null;

  const showBackButton = pathname !== "/dashboard";

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar onLogout={handleLogout} />
      <main style={{
        flex: 1,
        marginLeft: "300px",
        padding: "40px",
        width: "calc(100% - 300px)",
        position: "relative"
      }} className="main-content">

        {/* Global Back Button */}
        {showBackButton && (
          <div className="back-button-wrapper">
            <button
              onClick={() => router.back()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "none",
                border: "none",
                color: "var(--foreground-muted)",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "var(--radius-full)",
                transition: "color 0.2s",
                fontSize: "14px",
              }}
            >
              <div style={{
                padding: "8px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <ChevronLeft size={20} />
              </div>
              <span style={{ fontWeight: 500 }}>{t(lang, "back")}</span>
            </button>
          </div>
        )}

        {children}
        <VoiceCommandOverlay />
      </main>

      <style jsx global>{`
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
            width: 100% !important;
            padding: 20px !important;
            padding-top: max(20px, env(safe-area-inset-top) + 20px) !important;
            padding-bottom: 120px !important; /* Increased for bottom nav/mic */
          }

          .back-button-wrapper {
            position: sticky;
            top: 10px;
            z-index: 40;
            margin-bottom: 20px;
            margin-left: -10px; /* Slight offset alignment */
          }
        }
      `}</style>
    </div >
  );
}
