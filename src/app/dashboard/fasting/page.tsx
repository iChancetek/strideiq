"use client";

import FastingTimer from "@/components/dashboard/fasting/FastingTimer";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

// Initial simple history list (client-side fetch would be ideal, or server component)
// For now, let's keep it simple and just show the Timer. 
// We can add history later or fetch it here.

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
        <div className="max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Fasting Tracker</h1>
                <p className="text-foreground-muted">Track your intermittent fasting windows for metabolic health.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Timer Section */}
                <div className="md:col-span-1">
                    <FastingTimer />
                </div>

                {/* Info / Stats Section */}
                <div className="space-y-6">
                    <div className="glass-panel p-6">
                        <h3 className="text-xl font-bold mb-4">Why Fast?</h3>
                        <ul className="list-disc pl-5 space-y-2 text-foreground-muted text-sm">
                            <li>Improves insulin sensitivity</li>
                            <li>Promotes cellular repair (autophagy)</li>
                            <li>Can aid in weight management</li>
                            <li>Enhances mental clarity</li>
                        </ul>
                    </div>

                    <div className="glass-panel p-6">
                        <h3 className="text-xl font-bold mb-4">Recent Fasts</h3>
                        {loading ? (
                            <div className="animate-pulse h-20 bg-surface/50 rounded" />
                        ) : history.length === 0 ? (
                            <p className="text-foreground-muted text-sm">No completed fasts yet. Start one today!</p>
                        ) : (
                            <div className="space-y-3">
                                {history.map(log => (
                                    <div key={log.id} className="flex justify-between items-center text-sm border-b border-white/10 pb-2 last:border-0">
                                        <div>
                                            <div className="font-medium">{new Date(log.endTime).toLocaleDateString()}</div>
                                            <div className="text-xs text-foreground-muted">{log.type || "Custom"} Fast</div>
                                        </div>
                                        <div className="font-mono text-primary">
                                            {log.durationMinutes?.toFixed(1)} hrs
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
