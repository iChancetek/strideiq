"use client";

import Sidebar from "./Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { logOut } from "@/lib/firebase/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
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

      const text = `${timeGreeting}, ${name}. Welcome back to Stride IQ.`;

      if (window.speechSynthesis) {
        // Cancel any pending speech
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
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

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar onLogout={handleLogout} />
      <main style={{
        flex: 1,
        marginLeft: "250px",
        padding: "40px",
        width: "calc(100% - 250px)"
      }} className="main-content">
        {children}
      </main>

      <style jsx global>{`
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
            width: 100% !important;
            padding: 20px !important;
            padding-bottom: 80px !important; 
          }
        }
      `}</style>
    </div >
  );
}
