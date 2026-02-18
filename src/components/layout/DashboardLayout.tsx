"use client";

import Sidebar from "./Sidebar";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !user.emailVerified) {
      router.push("/verify-email");
    }
  }, [user, loading, router]);

  if (loading) return null; // Or a spinner

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{
        flex: 1,
        marginLeft: "250px", // Desktop Sidebar width
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
            padding-bottom: 80px !important; /* Space for FAB */
          }
        }
      `}</style>
    </div >
  );
}
