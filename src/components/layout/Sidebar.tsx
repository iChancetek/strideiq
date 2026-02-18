"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Activities", href: "/dashboard/activities", icon: "🏃" },
    { name: "Friends", href: "/dashboard/friends", icon: "👥" },
    { name: "Leaderboard", href: "/dashboard/leaderboard", icon: "🏆" },
    { name: "Steps", href: "/dashboard/steps", icon: "👟" },
    { name: "Steps Board", href: "/dashboard/steps-leaderboard", icon: "🥇" },
    { name: "Training Plan", href: "/dashboard/training", icon: "📅" },
    { name: "AI Coach", href: "/dashboard/coach", icon: "🤖" },
    { name: "Meditation", href: "/dashboard/meditation", icon: "🧘" },
    { name: "Fasting", href: "/dashboard/fasting", icon: "⏳" },
    { name: "Journal", href: "/dashboard/journal", icon: "📓" },
    { name: "Settings", href: "/dashboard/settings", icon: "⚙️" },
];

export default function Sidebar() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                className="mobile-toggle btn-primary"
                onClick={() => setIsOpen(!isOpen)}
                style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000, display: 'none' }}
            >
                {isOpen ? "✕" : "☰"}
            </button>

            <aside className={`glass-panel sidebar ${isOpen ? 'open' : ''}`} style={{
                width: "250px",
                height: "100vh",
                position: "fixed",
                top: 0,
                left: 0,
                borderRight: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                flexDirection: "column",
                padding: "20px",
                zIndex: 50
            }}>
                <div style={{ marginBottom: "40px", paddingLeft: "10px" }}>
                    <h2 style={{ fontSize: "24px", letterSpacing: "-0.5px" }}>
                        Stride<span className="text-gradient">IQ</span>
                    </h2>
                    <div style={{ fontSize: "10px", color: "var(--foreground-muted)", marginTop: "2px", letterSpacing: "0.5px" }}>
                        by ChanceTEK Fitness
                    </div>
                </div>

                <nav style={{ flex: 1 }}>
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            padding: "12px 16px",
                                            borderRadius: "var(--radius-md)",
                                            background: isActive ? "rgba(204, 255, 0, 0.1)" : "transparent",
                                            color: isActive ? "var(--primary)" : "var(--foreground-muted)",
                                            fontWeight: isActive ? 600 : 400,
                                            transition: "var(--transition-fast)"
                                        }}
                                    >
                                        <span>{item.icon}</span>
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div style={{ paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    {/* User Profile Snippet */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "var(--surface)", border: "1px solid var(--primary)",
                            backgroundImage: user?.photoURL ? `url(${user.photoURL})` : "none",
                            backgroundSize: "cover", backgroundPosition: "center",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            {!user?.photoURL && <span style={{ fontSize: "14px" }}>👤</span>}
                        </div>
                        <span style={{ fontSize: "14px", color: "var(--foreground-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "150px" }}>
                            {user?.displayName || "Runner"}
                        </span>
                    </div>
                </div>
            </aside>

            {/* Mobile Styles via style tag for now, ideally in CSS module */}
            <style jsx>{`
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .mobile-toggle {
            display: block !important;
          }
        }
      `}</style>
        </>
    );
}
