"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Medal, Trophy, Award, Lock, Timer, Route as RouteIcon, Zap, Activity } from "lucide-react";

// --- Badge Configuration ---
const BADGE_CONFIG: Record<string, { label: string, icon: any, color: string, description: string, glow: string }> = {
    "25_miles": {
        label: "25 Miles",
        icon: Medal,
        color: "#CCFF00", // Lime
        description: "Ran a total of 25 miles",
        glow: "0 0 20px rgba(204, 255, 0, 0.4)"
    },
    "50_miles": {
        label: "50 Miles",
        icon: Medal,
        color: "#00E5FF", // Cyan
        description: "Ran a total of 50 miles",
        glow: "0 0 20px rgba(0, 229, 255, 0.4)"
    },
    "100_miles": {
        label: "100 Miles",
        icon: Medal,
        color: "#FF0055", // Hot Pink
        description: "Ran a total of 100 miles",
        glow: "0 0 20px rgba(255, 0, 85, 0.4)"
    },
    "250_miles": {
        label: "250 Miles",
        icon: Trophy,
        color: "#CCFF00",
        description: "Ran a total of 250 miles",
        glow: "0 0 30px rgba(204, 255, 0, 0.6)"
    },
    "500_miles": {
        label: "500 Miles",
        icon: Trophy,
        color: "#00E5FF",
        description: "Ran a total of 500 miles",
        glow: "0 0 30px rgba(0, 229, 255, 0.6)"
    },
    "1000_miles": {
        label: "1K Club",
        icon: Award,
        color: "#FF0055",
        description: "Ran a total of 1,000 miles",
        glow: "0 0 40px rgba(255, 0, 85, 0.8)"
    },
};

export default function AchievementsPage() {
    const { user } = useAuth();
    const [userStats, setUserStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const fetchStats = async () => {
                try {
                    const statsRef = doc(db, "users", user.uid, "stats", "allTime");
                    const snap = await getDoc(statsRef);
                    if (snap.exists()) {
                        setUserStats(snap.data());
                    }
                } catch (e) {
                    console.error("Error fetching stats:", e);
                } finally {
                    setLoading(false);
                }
            };
            fetchStats();
        }
    }, [user]);

    const badges = userStats?.badges || [];
    const earnedSet = new Set(badges.map((b: any) => b.id));
    const records = userStats?.records || {};

    return (
        <div className="max-w-7xl mx-auto pb-20">
            {/* Hero Header */}
            <header className="mb-12 relative p-8 md:p-12 rounded-3xl overflow-hidden border border-white/5 bg-black">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10 text-center">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 text-white uppercase" style={{ fontFamily: 'var(--font-heading)' }}>
                        Hall of <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Fame</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
                        Push your limits. Break your records. <span className="text-white font-medium">Become Legendary.</span>
                    </p>
                </div>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
                    <div className="h-96 rounded-3xl bg-white/5 col-span-1" />
                    <div className="h-96 rounded-3xl bg-white/5 col-span-2" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Personal Records (HUD Style) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-primary/30 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
                            <div className="relative z-10">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white uppercase tracking-widest text-xs">
                                    <Activity size={16} className="text-primary" />
                                    Personal Records
                                </h2>

                                <div className="space-y-4">
                                    {/* Fastest Mile */}
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex items-center justify-between group/item">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-lg bg-black text-secondary border border-secondary/20 group-hover/item:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all">
                                                <Timer size={24} />
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Fastest Mile</div>
                                                <div className="text-2xl font-bold text-white font-mono">
                                                    {records.fastestMile ? records.fastestMile.display : "--:--"}
                                                </div>
                                            </div>
                                        </div>
                                        {records.fastestMile && <Zap size={16} className="text-secondary opacity-0 group-hover/item:opacity-100 transition-opacity" />}
                                    </div>

                                    {/* Longest Run */}
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex items-center justify-between group/item">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-lg bg-black text-primary border border-primary/20 group-hover/item:shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all">
                                                <RouteIcon size={24} />
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Longest Run</div>
                                                <div className="text-2xl font-bold text-white font-mono">
                                                    {records.longestRun ? records.longestRun.display : "0.0 mi"}
                                                </div>
                                            </div>
                                        </div>
                                        {records.longestRun && <Zap size={16} className="text-primary opacity-0 group-hover/item:opacity-100 transition-opacity" />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 text-center">
                            <h3 className="text-2xl font-bold text-white mb-2 italic">"NO LIMITS"</h3>
                            <p className="text-xs text-gray-400 uppercase tracking-widest">Keep Pushing Forward</p>
                        </div>
                    </div>

                    {/* Right Column: Trophy Case (Grid) */}
                    <div className="lg:col-span-8">
                        <section className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                                <Trophy size={200} />
                            </div>

                            <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-white uppercase tracking-widest text-xs relative z-10">
                                <Award size={16} className="text-secondary" />
                                Trophy Case
                            </h2>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 relative z-10">
                                {Object.entries(BADGE_CONFIG).map(([id, config]) => {
                                    const isEarned = earnedSet.has(id);
                                    const Icon = config.icon;

                                    return (
                                        <div
                                            key={id}
                                            className={`relative group p-4 rounded-xl border flex flex-col items-center text-center transition-all duration-300 ${isEarned
                                                    ? "bg-black border-white/10 hover:border-primary/50"
                                                    : "bg-black/40 border-white/5 opacity-40 grayscale"
                                                }`}
                                        >
                                            <div
                                                className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                                                style={{
                                                    background: isEarned ? "black" : "rgba(255,255,255,0.05)",
                                                    border: isEarned ? `1px solid ${config.color}` : "none",
                                                    boxShadow: isEarned ? config.glow : "none"
                                                }}
                                            >
                                                {isEarned ? (
                                                    <Icon size={28} color={config.color} />
                                                ) : (
                                                    <Lock size={20} color="#444" />
                                                )}
                                            </div>

                                            <h3 className={`font-bold text-sm mb-1 ${isEarned ? "text-white" : "text-gray-600"}`}>
                                                {config.label}
                                            </h3>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                                                {isEarned ? "Unlocked" : "Locked"}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                </div>
            )}
        </div>
    );
}
