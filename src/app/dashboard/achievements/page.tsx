"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Medal, Trophy, Award, Lock, Timer, Route as RouteIcon, TrendingUp, Zap } from "lucide-react";

// --- Badge Configuration ---
const BADGE_CONFIG: Record<string, { label: string, icon: any, color: string, description: string, gradient: string }> = {
    "25_miles": {
        label: "25 Miles",
        icon: Medal,
        color: "#cd7f32",
        description: "Ran a total of 25 miles",
        gradient: "linear-gradient(135deg, #cd7f32 0%, #a05a2c 100%)"
    },
    "50_miles": {
        label: "50 Miles",
        icon: Medal,
        color: "#c0c0c0",
        description: "Ran a total of 50 miles",
        gradient: "linear-gradient(135deg, #e0e0e0 0%, #b0b0b0 100%)"
    },
    "100_miles": {
        label: "100 Miles",
        icon: Medal,
        color: "#ffd700",
        description: "Ran a total of 100 miles",
        gradient: "linear-gradient(135deg, #ffd700 0%, #e6ac00 100%)"
    },
    "250_miles": {
        label: "250 Miles",
        icon: Trophy,
        color: "#00E5FF",
        description: "Ran a total of 250 miles",
        gradient: "linear-gradient(135deg, #00E5FF 0%, #00B8D4 100%)"
    },
    "500_miles": {
        label: "500 Miles",
        icon: Trophy,
        color: "#FF0055",
        description: "Ran a total of 500 miles",
        gradient: "linear-gradient(135deg, #FF0055 0%, #D500F9 100%)"
    },
    "1000_miles": {
        label: "1K Club",
        icon: Award,
        color: "#CCFF00",
        description: "Ran a total of 1,000 miles",
        gradient: "linear-gradient(135deg, #CCFF00 0%, #64DD17 100%)"
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
        <div className="max-w-6xl mx-auto pb-10">
            {/* Header Section */}
            <header className="mb-10 text-center relative overflow-hidden p-10 rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-xl border border-white/10" style={{ zIndex: -1 }} />
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                    Achievements
                </h1>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                    Track your progress, earn exclusive badges, and break your personal records.
                </p>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
                    <div className="h-64 rounded-3xl bg-white/5" />
                    <div className="h-64 rounded-3xl bg-white/5" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Personal Records (4 cols) */}
                    <div className="lg:col-span-4 space-y-8">
                        <section className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Zap size={100} />
                            </div>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <span className="bg-yellow-500/20 p-2 rounded-lg text-yellow-500"><Trophy size={20} /></span>
                                Personal Records
                            </h2>
                            <div className="space-y-4">
                                {records.fastestMile ? (
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/5 hover:border-white/10 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                                                <Timer size={24} />
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-400 font-medium">Fastest Mile</div>
                                                <div className="text-2xl font-bold text-white">{records.fastestMile.display}</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-gray-500 text-center text-sm">No fastest mile recorded yet</div>
                                )}

                                {records.longestRun ? (
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/5 hover:border-white/10 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 group-hover:scale-110 transition-transform">
                                                <RouteIcon size={24} />
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-400 font-medium">Longest Run</div>
                                                <div className="text-2xl font-bold text-white">{records.longestRun.display}</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-gray-500 text-center text-sm">No longest run recorded yet</div>
                                )}
                            </div>
                        </section>

                        <section className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-3xl p-6 text-center">
                            <h3 className="text-xl font-bold text-primary mb-2">Keep Pushing!</h3>
                            <p className="text-sm text-gray-400">Consistency is key. Your next record is just one run away.</p>
                        </section>
                    </div>

                    {/* Right Column: Trophy Case (8 cols) */}
                    <div className="lg:col-span-8">
                        <section className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 h-full">
                            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                                <span className="bg-purple-500/20 p-2 rounded-lg text-purple-500"><Award size={20} /></span>
                                Trophy Case
                            </h2>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                {Object.entries(BADGE_CONFIG).map(([id, config]) => {
                                    const isEarned = earnedSet.has(id);
                                    const Icon = config.icon;

                                    return (
                                        <div
                                            key={id}
                                            className={`relative group p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center ${isEarned
                                                    ? "bg-white/5 border-white/10 hover:bg-white/10 hover:scale-105 hover:shadow-2xl hover:shadow-primary/10"
                                                    : "bg-black/20 border-white/5 opacity-50 contrast-50 grayscale"
                                                }`}
                                        >
                                            <div
                                                className="w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg transition-transform duration-300 group-hover:rotate-12"
                                                style={{
                                                    background: isEarned ? config.gradient : "rgba(255,255,255,0.05)",
                                                    boxShadow: isEarned ? `0 10px 30px -10px ${config.color}` : "none"
                                                }}
                                            >
                                                {isEarned ? (
                                                    <Icon size={32} color="white" strokeWidth={2.5} />
                                                ) : (
                                                    <Lock size={24} color="#666" />
                                                )}
                                            </div>

                                            <h3 className={`font-bold text-lg mb-1 ${isEarned ? "text-white" : "text-gray-500"}`}>
                                                {config.label}
                                            </h3>
                                            <p className="text-xs text-gray-500 leading-tight">
                                                {config.description}
                                            </p>

                                            {isEarned && (
                                                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none" />
                                            )}
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
