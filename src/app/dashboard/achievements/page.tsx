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
            {/* Header Section - Agentic Style */}
            <header className="mb-10 lg:mb-16 text-center relative px-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] lg:text-xs font-bold tracking-widest uppercase mb-4 lg:mb-6">
                    <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-primary animate-pulse" />
                    Powered by Agentic AI
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif text-white mb-4 lg:mb-6 leading-tight">
                    The Hall of <br className="md:hidden" /><span className="text-primary italic">Excellence</span>
                </h1>

                <p className="text-sm md:text-lg text-gray-400 max-w-2xl mx-auto font-sans font-light leading-relaxed">
                    StrideIQ isn't just a tracker. It's a swarm of <strong className="text-white">intelligent, autonomous agents</strong> recognizing your every milestone.
                </p>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse px-4">
                    <div className="h-64 lg:h-96 rounded-3xl bg-white/5 col-span-1" />
                    <div className="h-64 lg:h-96 rounded-3xl bg-white/5 col-span-2" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 px-4">

                    {/* Left Column: Personal Records (Agentic HUD) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-[#050505] border-l-4 border-primary p-6 lg:p-8 relative overflow-hidden group rounded-xl lg:rounded-none">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <Activity size={80} className="lg:w-[120px] lg:h-[120px]" />
                            </div>

                            <h2 className="text-xl lg:text-2xl font-serif text-white mb-6 lg:mb-8 border-b border-white/10 pb-4">
                                Active Performance
                            </h2>

                            <div className="space-y-6">
                                {/* Fastest Mile */}
                                <div className="group/item">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] lg:text-xs uppercase tracking-widest text-gray-500 group-hover/item:text-primary transition-colors">Fastest Mile</span>
                                        <Timer size={14} className="text-gray-600 group-hover/item:text-primary transition-colors" />
                                    </div>
                                    <div className="text-3xl lg:text-4xl font-serif text-white">
                                        {records.fastestMile ? records.fastestMile.display : "--:--"}
                                    </div>
                                </div>

                                {/* Longest Run */}
                                <div className="group/item">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] lg:text-xs uppercase tracking-widest text-gray-500 group-hover/item:text-secondary transition-colors">Longest Run</span>
                                        <RouteIcon size={14} className="text-gray-600 group-hover/item:text-secondary transition-colors" />
                                    </div>
                                    <div className="text-3xl lg:text-4xl font-serif text-white">
                                        {records.longestRun ? records.longestRun.display : "0.0 mi"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 lg:p-8 bg-zinc-900/30 border border-white/5 text-center rounded-xl lg:rounded-none">
                            <h3 className="text-lg lg:text-xl font-serif text-white mb-2 italic">"Efficiency is the essence of survival."</h3>
                            <p className="text-[10px] lg:text-xs text-gray-500 uppercase tracking-widest">— Your AI Coach</p>
                        </div>
                    </div>

                    {/* Right Column: Trophy Case (Minimalist Grid) */}
                    <div className="lg:col-span-8">
                        <section className="bg-[#050505] p-6 lg:p-8 h-full relative rounded-xl lg:rounded-none border border-white/5 lg:border-none">
                            <h2 className="text-xl lg:text-2xl font-serif text-white mb-6 lg:mb-8 border-b border-white/10 pb-4 flex items-center justify-between">
                                <span>Trophy Case</span>
                                <Award size={20} className="text-white/20 lg:w-6 lg:h-6" />
                            </h2>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                                {Object.entries(BADGE_CONFIG).map(([id, config]) => {
                                    const isEarned = earnedSet.has(id);
                                    const Icon = config.icon;

                                    return (
                                        <div
                                            key={id}
                                            className={`relative group p-4 lg:p-6 border flex flex-col items-center text-center transition-all duration-500 rounded-lg ${isEarned
                                                ? "bg-zinc-900/20 border-white/10 hover:border-primary/50"
                                                : "bg-transparent border-white/5 opacity-30 grayscale"
                                                }`}
                                        >
                                            <div
                                                className="mb-3 lg:mb-4 transition-all duration-500 group-hover:scale-110"
                                            >
                                                {isEarned ? (
                                                    <Icon size={24} className="lg:w-8 lg:h-8" color={config.color} strokeWidth={1.5} />
                                                ) : (
                                                    <Lock size={20} className="lg:w-6 lg:h-6" color="#333" />
                                                )}
                                            </div>

                                            <h3 className={`font-serif text-sm lg:text-lg mb-1 lg:mb-2 ${isEarned ? "text-white" : "text-gray-700"}`}>
                                                {config.label}
                                            </h3>
                                            <p className="text-[9px] lg:text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
                                                {config.description}
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
