"use client";

import FastingTimer from "@/components/dashboard/fasting/FastingTimer";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Activity, Flame, Clock, Calendar } from "lucide-react";

export default function FastingPage() {
    const { user } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        async function fetchHistory() {
            try {
                const token = await user?.getIdToken();
                if (!token) return;
                const res = await fetch("/api/fasting/list", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data.logs);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, [user]);

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-10 text-center relative z-10">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 border border-primary/20 mb-4 backdrop-blur-sm">
                    <Flame className="text-primary w-6 h-6 mr-2 animate-pulse" />
                    <span className="text-primary font-bold tracking-wider text-sm uppercase">Metabolic Health</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-4">
                    Fasting <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Tracker</span>
                </h1>
                <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
                    Optimize your cellular repair and metabolic flexibility through intermittent fasting.
                </p>

                {/* Background Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Main Timer Section */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="glass-panel p-8 md:p-12 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        <FastingTimer />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-panel p-6 flex flex-col items-center text-center hover:border-primary/30 transition-colors">
                            <Activity className="w-8 h-8 text-accent mb-3" />
                            <h3 className="font-bold">Autophagy</h3>
                            <p className="text-xs text-foreground-muted mt-1">Cellular repair & cleaning</p>
                        </div>
                        <div className="glass-panel p-6 flex flex-col items-center text-center hover:border-primary/30 transition-colors">
                            <Flame className="w-8 h-8 text-primary mb-3" />
                            <h3 className="font-bold">Fat Burn</h3>
                            <p className="text-xs text-foreground-muted mt-1">Ketosis & lipid oxidation</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info & History */}
                <div className="lg:col-span-5 space-y-6">

                    {/* Benefits Card */}
                    <div className="glass-panel p-8 bg-gradient-to-b from-surface to-black/40">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary rounded-full" />
                            Physiological Benefits
                        </h3>
                        <ul className="space-y-4">
                            {[
                                { title: "Insulin Sensitivity", desc: "Lowers blood sugar & insulin resistance." },
                                { title: "HGH Production", desc: "Boosts growth hormone for muscle preservation." },
                                { title: "Mental Clarity", desc: "BDNF increase for sharper focus." },
                                { title: "Inflammation", desc: "Reduces systemic inflammation markers." }
                            ].map((item, i) => (
                                <li key={i} className="flex gap-4 items-start">
                                    <div className="w-6 h-6 rounded-full bg-surface-hover border border-white/10 flex items-center justify-center text-xs font-mono text-primary flex-shrink-0 mt-0.5">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm">{item.title}</div>
                                        <div className="text-xs text-foreground-muted">{item.desc}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Recent Fasts */}
                    <div className="glass-panel p-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Recent Fasts
                        </h3>

                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />)}
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-8 px-4 border border-dashed border-white/10 rounded-xl bg-white/5">
                                <p className="text-foreground-muted text-sm">No completed fasts yet.<br />Your journey begins with the first step.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {history.map(log => (
                                    <div key={log.id} className="group relative p-4 rounded-xl bg-surface border border-white/5 hover:border-primary/30 transition-all hover:translate-x-1">
                                        <div className="flex justify-between items-center z-10 relative">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center text-foreground-muted group-hover:text-primary transition-colors">
                                                    <Calendar size={16} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm group-hover:text-primary transition-colors">
                                                        {new Date(log.endTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </div>
                                                    <div className="text-[10px] text-foreground-muted uppercase tracking-wider">{log.type || "Custom"}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono text-lg font-bold text-primary leading-none">
                                                    {log.durationMinutes?.toFixed(1)}
                                                </div>
                                                <div className="text-[10px] text-foreground-muted">hours</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
