"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
// Client-side component handles UI and API calls

// Correcting to use client SDK or pass via props. For now, we will use a server action or API route for saving.
// Actually, let's use the pattern of client-side logic + API call.

export default function FastingTimer() {
    const { user } = useAuth();
    const [isFasting, setIsFasting] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [goalHours, setGoalHours] = useState(16);

    // Hydrate from local storage
    useEffect(() => {
        const storedStart = localStorage.getItem("fasting_start");
        const storedGoal = localStorage.getItem("fasting_goal");
        if (storedStart) {
            setStartTime(parseInt(storedStart));
            setIsFasting(true);
            setGoalHours(storedGoal ? parseInt(storedGoal) : 16);
        }
    }, []);

    // Timer tick
    useEffect(() => {
        if (!isFasting || !startTime) return;
        const interval = setInterval(() => {
            setElapsed(Date.now() - startTime);
        }, 1000);
        return () => clearInterval(interval);
    }, [isFasting, startTime]);

    const toggleFasting = async () => {
        if (isFasting) {
            // End Fast
            const endTime = Date.now();
            const durationMinutes = (endTime - (startTime || 0)) / 1000 / 60;

            // Save to DB via API
            try {
                await fetch("/api/fasting/log", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        startTime,
                        endTime,
                        durationMinutes,
                        type: `${goalHours}:8`, // simplistic type
                        goalHours
                    })
                });
            } catch (e) {
                console.error("Failed to save fast", e);
            }

            // Reset
            setIsFasting(false);
            setStartTime(null);
            setElapsed(0);
            localStorage.removeItem("fasting_start");
            localStorage.removeItem("fasting_goal");
        } else {
            // Start Fast
            const now = Date.now();
            setStartTime(now);
            setIsFasting(true);
            localStorage.setItem("fasting_start", now.toString());
            localStorage.setItem("fasting_goal", goalHours.toString());
        }
    };

    // Format helpers
    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const progress = Math.min((elapsed / (goalHours * 3600 * 1000)) * 100, 100);

    return (
        <div className="glass-panel p-6 flex flex-col items-center justify-center text-center">
            <h2 className="text-xl font-bold mb-4">Intermittent Fasting</h2>

            <div className="relative w-64 h-64 mb-6 flex items-center justify-center">
                {/* Circular Progress Placeholder - CSS Conic Gradient */}
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: `conic-gradient(var(--primary) ${progress}%, var(--surface-hover) ${progress}% 100%)`,
                    mask: 'radial-gradient(transparent 55%, black 56%)',
                    WebkitMask: 'radial-gradient(transparent 55%, black 56%)'
                }} />

                <div className="z-10 flex flex-col items-center">
                    <div className="text-sm text-foreground-muted mb-1">
                        {isFasting ? "Elapsed Time" : "Ready to Fast?"}
                    </div>
                    <div className="text-4xl font-mono font-bold tracking-tight">
                        {isFasting ? formatTime(elapsed) : "0:00:00"}
                    </div>
                    {isFasting && (
                        <div className="text-xs text-primary mt-2">
                            {progress.toFixed(1)}% of {goalHours}h Goal
                        </div>
                    )}
                </div>
            </div>

            {!isFasting && (
                <div className="flex gap-2 mb-6">
                    {[16, 18, 20, 24].map(h => (
                        <button
                            key={h}
                            onClick={() => setGoalHours(h)}
                            className={`px-3 py-1 rounded-full text-xs border ${goalHours === h ? 'border-primary text-primary bg-primary/10' : 'border-border text-foreground-muted'}`}
                        >
                            {h}h
                        </button>
                    ))}
                </div>
            )}

            <button
                onClick={toggleFasting}
                className={`px-8 py-3 rounded-full font-bold transition-all ${isFasting ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-primary text-background hover:opacity-90'}`}
            >
                {isFasting ? "End Fast" : "Start Fasting"}
            </button>
        </div>
    );
}
