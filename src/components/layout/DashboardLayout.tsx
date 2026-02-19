"use client";

import Sidebar from "./Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logOut } from "@/lib/firebase/auth";
import VoiceCommandOverlay from "@/components/dashboard/VoiceCommandOverlay";
import { ChevronLeft } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasGreeted = useRef(false);

  useEffect(() => {
    if (!loading && user && !user.emailVerified) {
      router.push("/verify-email");
    }
  }, [user, loading, router]);

  // Voice Greeting
  useEffect(() => {
    if (!loading && user && !hasGreeted.current) {
      hasGreeted.current = true;
      const name = user.displayName?.split(" ")[0] || "there";
      const hour = new Date().getHours();
      let timeGreeting = "Good morning";
      if (hour >= 12 && hour < 17) timeGreeting = "Good afternoon";
      if (hour >= 17) timeGreeting = "Good evening";

      const text = `${timeGreeting}, ${name}. Welcome back to Stride IQ! Ready to crush some goals today?`;

      const speak = () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);

          // Attempt to find a female/natural voice
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(v =>
            v.name.includes("Google US English") ||
            v.name.includes("Zira") ||
            (v.name.includes("Female") && v.lang.startsWith("en"))
          );

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }

          utterance.rate = 1.1; // Slightly faster for enthusiasm
          utterance.pitch = 1.1; // Slightly higher
          window.speechSynthesis.speak(utterance);
        }
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = speak;
      } else {
        speak();
      }
    }
  }, [user, loading]);

  const handleLogout = async () => {
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
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
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 no-underline backdrop-blur-md">
                <ChevronLeft size={20} />
              </div>
              <span className="text-sm font-medium">Back</span>
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
