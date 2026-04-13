"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { t } from "@/lib/translations";

interface SidebarProps {
    onLogout?: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
    const { user } = useAuth();
    const { settings } = useSettings();
    const { unreadCount } = useNotifications();
    const lang = settings.language;
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setDeferredPrompt(null);
        }
    };

    return (
        <>
            {/* Desktop Hover Trigger Zone (Invisible bar at far left) */}
            <div 
                className="sidebar-trigger"
                onMouseEnter={() => setIsHovered(true)}
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: "20px",
                    zIndex: 49, // Just below sidebar
                    display: "block"
                }}
            />

            <button
                className="mobile-toggle btn-primary"
                onClick={() => setIsOpen(!isOpen)}
                style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000, display: 'none' }}
            >
                {isOpen ? "✕" : "☰"}
            </button>

            <aside 
                className={`glass-panel sidebar ${isOpen ? 'open' : ''} ${isHovered ? 'hovered' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    width: "260px",
                    position: "fixed",
                    top: "20px",
                    left: "20px",
                    bottom: "20px",
                    borderRadius: "24px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    padding: "24px",
                    zIndex: 50,
                    transition: "transform 0.4s cubic-bezier(0.19, 1, 0.22, 1), box-shadow 0.4s ease",
                    overflow: "hidden"
                }}
            >
                <Link href="/dashboard" style={{ textDecoration: "none", color: "inherit", display: "block", marginBottom: "30px", paddingLeft: "4px" }}>
                    <h2 style={{ fontSize: "24px", letterSpacing: "-0.5px", fontWeight: 800 }}>
                        Stride<span className="text-gradient">IQ</span>
                    </h2>
                    <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginTop: "4px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                        Agentic Fitness
                    </div>
                </Link>

                <nav style={{ flex: 1, overflowY: "auto", margin: "0 -10px", padding: "0 10px", scrollbarWidth: "none" }}>
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                        {[
                            { name: t(lang, "dashboard"), href: "/dashboard", icon: "📊" },
                            { name: t(lang, "activities"), href: "/dashboard/activities", icon: "🏃" },
                            { name: "Notifications", href: "/dashboard/notifications", icon: "🔔", badge: unreadCount },
                            { name: t(lang, "friends"), href: "/dashboard/friends", icon: "👥" },
                            { name: t(lang, "leaderboard"), href: "/dashboard/leaderboard", icon: "🏆" },
                            { name: t(lang, "steps"), href: "/dashboard/steps", icon: "👟" },
                            { name: t(lang, "stepsBoard"), href: "/dashboard/steps-leaderboard", icon: "🥇" },
                            { name: t(lang, "training"), href: "/dashboard/training", icon: "📅" },
                            { name: t(lang, "aiCoach"), href: "/dashboard/coach", icon: "🤖" },
                            { name: t(lang, "meditation"), href: "/dashboard/meditation", icon: "🧘" },
                            { name: t(lang, "fasting"), href: "/dashboard/fasting", icon: "⏳" },
                            { name: t(lang, "journal"), href: "/dashboard/journal", icon: "📓" },
                            { name: t(lang, "settings"), href: "/dashboard/settings", icon: "⚙️" },
                            { name: t(lang, "guide"), href: "/dashboard/learn-more", icon: "📚" },
                        ].map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "14px",
                                            padding: "12px 16px",
                                            borderRadius: "14px",
                                            background: isActive ? "linear-gradient(90deg, rgba(204, 255, 0, 0.15), rgba(204, 255, 0, 0.05))" : "transparent",
                                            color: isActive ? "var(--primary)" : "var(--foreground-muted)",
                                            fontWeight: isActive ? 600 : 400,
                                            transition: "all 0.2s ease",
                                            border: isActive ? "1px solid rgba(204, 255, 0, 0.2)" : "1px solid transparent",
                                            position: "relative"
                                        }}
                                    >
                                        <span style={{ fontSize: "18px" }}>{item.icon}</span>
                                        {item.name}
                                        {item.badge !== undefined && item.badge > 0 && (
                                            <span style={{
                                                position: "absolute",
                                                right: "12px",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                background: "var(--error, #ff4d4d)",
                                                color: "white",
                                                fontSize: "10px",
                                                fontWeight: 800,
                                                padding: "2px 6px",
                                                borderRadius: "10px",
                                                minWidth: "18px",
                                                textAlign: "center"
                                            }}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                        {/* Achievements Link */}
                        <li>
                            <Link
                                href="/dashboard/achievements"
                                onClick={() => setIsOpen(false)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "14px",
                                    padding: "12px 16px",
                                    borderRadius: "14px",
                                    background: pathname === "/dashboard/achievements" ? "rgba(204, 255, 0, 0.15)" : "transparent",
                                    color: pathname === "/dashboard/achievements" ? "var(--primary)" : "var(--foreground-muted)",
                                    fontWeight: pathname === "/dashboard/achievements" ? 600 : 400,
                                    border: pathname === "/dashboard/achievements" ? "1px solid rgba(204, 255, 0, 0.2)" : "1px solid transparent"
                                }}
                            >
                                <span style={{ fontSize: "18px" }}>🏅</span>
                                {t(lang, "achievements")}
                            </Link>
                        </li>

                        {/* External Links Section */}
                        <li style={{ marginTop: "20px", padding: "0 16px 8px 16px", fontSize: "11px", fontWeight: 700, color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                            Platforms
                        </li>
                        <li>
                            <a 
                                href="https://Famio.us" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "14px",
                                    padding: "12px 16px",
                                    borderRadius: "14px",
                                    color: "var(--foreground-muted)",
                                    transition: "all 0.2s ease",
                                    textDecoration: "none"
                                }}
                            >
                                <span style={{ fontSize: "18px" }}>🌐</span>
                                Famio - We Are One
                            </a>
                        </li>
                        <li>
                            <a 
                                href="https://iSkylar.us" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "14px",
                                    padding: "12px 16px",
                                    borderRadius: "14px",
                                    color: "var(--foreground-muted)",
                                    transition: "all 0.2s ease",
                                    textDecoration: "none"
                                }}
                            >
                                <span style={{ fontSize: "18px" }}>🎙️</span>
                                iSkylar - AI Therapist
                            </a>
                        </li>

                        {/* Admin Link (Conditional) */}
                        {user?.email && ["chancellor@ichancetek.com", "chanceminus@gmail.com"].includes(user.email.toLowerCase()) && (
                            <li>
                                <Link
                                    href="/dashboard/admin"
                                    onClick={() => setIsOpen(false)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "14px",
                                        padding: "12px 16px",
                                        borderRadius: "14px",
                                        background: pathname.startsWith("/admin") ? "rgba(255, 255, 255, 0.1)" : "transparent",
                                        color: pathname.startsWith("/admin") ? "#fff" : "var(--foreground-muted)",
                                        fontWeight: pathname.startsWith("/admin") ? 600 : 400,
                                        border: pathname.startsWith("/admin") ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid transparent",
                                        marginTop: "10px",
                                        boxShadow: "0 0 15px rgba(204, 255, 0, 0.1)"
                                    }}
                                >
                                    <span style={{ fontSize: "18px" }}>🛡️</span>
                                    Admin Dashboard
                                </Link>
                            </li>
                        )}
                    </ul>
                </nav>

                <div style={{ paddingTop: "20px", marginTop: "10px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* Uninstall / PWA Button */}
                    {deferredPrompt && (
                        <button
                            onClick={handleInstall}
                            className="btn-primary"
                            style={{
                                width: "100%",
                                padding: "10px",
                                fontSize: "13px",
                                background: "var(--primary)",
                                color: "black",
                                fontWeight: "bold",
                                borderRadius: "12px"
                            }}
                        >
                            ⬇ {t(lang, "installApp")}
                        </button>
                    )}

                    {onLogout && (
                        <button
                            onClick={onLogout}
                            style={{
                                display: "flex", alignItems: "center", gap: "12px",
                                padding: "12px 16px", borderRadius: "14px",
                                color: "var(--error)", background: "rgba(255, 50, 50, 0.1)",
                                border: "1px solid rgba(255, 50, 50, 0.2)", cursor: "pointer",
                                width: "100%", textAlign: "left", fontSize: "14px", fontWeight: 600,
                                transition: "background 0.2s"
                            }}
                        >
                            <span>🚪</span> {t(lang, "logOut")}
                        </button>
                    )}

                    {/* User Profile */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 4px" }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: "var(--surface)", border: "2px solid var(--primary)",
                            backgroundImage: user?.photoURL ? `url(${user.photoURL})` : "none",
                            backgroundSize: "cover", backgroundPosition: "center",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            {!user?.photoURL && <span style={{ fontSize: "16px" }}>👤</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {user?.displayName || "Runner"}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>Free Plan</div>
                        </div>
                    </div>
                </div>
            </aside>

            <style jsx>{`
        /* Desktop: Collapsed by default, expand on hover */
        @media (min-width: 769px) {
          .sidebar {
            transform: translateX(-110%);
            box-shadow: none;
          }
          .sidebar.hovered {
            transform: translateX(0);
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          }
          .sidebar-trigger {
            display: block;
          }
        }

        @media (max-width: 768px) {
          .sidebar-trigger {
            display: none !important;
          }
          .sidebar {
            width: 80% !important;
            height: auto !important;
            top: 20px !important;
            bottom: 20px !important;
            left: 20px !important;
            transform: translateX(-120%);
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
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
