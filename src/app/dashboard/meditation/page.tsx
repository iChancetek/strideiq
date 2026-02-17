"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useRef, useEffect } from "react";

const moods = [
    { id: "pre-run", label: "Pre-Run Hype", icon: "🔥", prompt: "high energy visualization for a successful run" },
    { id: "recovery", label: "Post-Run Recovery", icon: "🌱", prompt: "calm body scan and muscle relaxation" },
    { id: "focus", label: "Deep Focus", icon: "🎯", prompt: "mental clarity and concentration" },
    { id: "sleep", label: "Sleep Aid", icon: "🌙", prompt: "deep relaxation for sleep" },
    { id: "resilience", label: "Mental Toughness", icon: "💪", prompt: "building mental resilience and grit" },
];

export default function MeditationPage() {
    const [selectedMood, setSelectedMood] = useState(moods[0]);
    const [duration, setDuration] = useState(5);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const generateSession = async () => {
        setIsLoading(true);
        setAudioUrl(null); // Clear previous
        setIsPlaying(false);

        try {
            const res = await fetch("/api/meditate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: selectedMood.prompt,
                    duration: duration
                }),
            });

            if (!res.ok) throw new Error("Failed to generate");

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);

            // Auto-play when ready
            setTimeout(() => {
                if (audioRef.current) {
                    audioRef.current.play();
                    setIsPlaying(true);
                }
            }, 100);

        } catch (error) {
            console.error(error);
            alert("Failed to create session. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const togglePlay = () => {
        if (!audioRef.current || !audioUrl) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
                <header style={{ marginBottom: "40px" }}>
                    <h1 style={{ fontSize: "36px", marginBottom: "10px" }}>AI Mindset Coach</h1>
                    <p style={{ color: "var(--foreground-muted)", fontSize: "18px" }}>
                        Generate a personalized meditation session powered by Elite AI.
                    </p>
                </header>

                <div className="glass-panel" style={{ padding: "40px", borderRadius: "var(--radius-lg)", position: "relative", overflow: "hidden" }}>

                    {/* Visualizer Background (Simple Pulse) */}
                    {isPlaying && (
                        <div style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "300px",
                            height: "300px",
                            background: "radial-gradient(circle, rgba(204, 255, 0, 0.2) 0%, rgba(0,0,0,0) 70%)",
                            borderRadius: "50%",
                            animation: "pulse 4s infinite ease-in-out",
                            zIndex: 0
                        }}></div>
                    )}

                    <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "30px" }}>

                        {/* Configuration */}
                        {!isPlaying && !audioUrl && (
                            <>
                                <div>
                                    <label style={{ display: "block", marginBottom: "15px", fontWeight: 600 }}>Choose your focus</label>
                                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
                                        {moods.map((m) => (
                                            <button
                                                key={m.id}
                                                onClick={() => setSelectedMood(m)}
                                                style={{
                                                    padding: "12px 20px",
                                                    borderRadius: "var(--radius-full)",
                                                    border: `1px solid ${selectedMood.id === m.id ? "var(--primary)" : "rgba(255,255,255,0.1)"}`,
                                                    background: selectedMood.id === m.id ? "rgba(204, 255, 0, 0.1)" : "rgba(255,255,255,0.05)",
                                                    color: selectedMood.id === m.id ? "var(--primary)" : "var(--foreground)",
                                                    cursor: "pointer",
                                                    transition: "all 0.2s"
                                                }}
                                            >
                                                {m.icon} {m.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: "block", marginBottom: "15px", fontWeight: 600 }}>Duration (Approx minutes)</label>
                                    <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                                        {[1, 3, 5, 10].map((min) => (
                                            <button
                                                key={min}
                                                onClick={() => setDuration(min)}
                                                style={{
                                                    width: "50px",
                                                    height: "50px",
                                                    borderRadius: "50%",
                                                    border: `1px solid ${duration === min ? "var(--primary)" : "rgba(255,255,255,0.1)"}`,
                                                    background: duration === min ? "var(--primary)" : "transparent",
                                                    color: duration === min ? "#000" : "var(--foreground)",
                                                    fontWeight: 600,
                                                    cursor: "pointer"
                                                }}
                                            >
                                                {min}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    className="btn-primary"
                                    onClick={generateSession}
                                    disabled={isLoading}
                                    style={{ alignSelf: "center", minWidth: "200px", justifyContent: "center", fontSize: "18px", padding: "16px 32px" }}
                                >
                                    {isLoading ? "Generating Session..." : "Begin Session"}
                                </button>
                            </>
                        )}


                        {/* Player UI */}
                        {(audioUrl || isLoading) && (
                            <div style={{ textAlign: "center", padding: "20px 0" }}>
                                {isLoading ? (
                                    <div style={{ fontSize: "20px", color: "var(--primary)", animation: "pulse 1s infinite" }}>
                                        Crafting your session...
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ fontSize: "24px", marginBottom: "30px", fontWeight: 600 }}>
                                            {selectedMood.label}
                                        </div>

                                        <button
                                            onClick={togglePlay}
                                            style={{
                                                width: "80px",
                                                height: "80px",
                                                borderRadius: "50%",
                                                background: "var(--primary)",
                                                color: "#000",
                                                border: "none",
                                                fontSize: "32px",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                cursor: "pointer",
                                                boxShadow: "0 0 20px rgba(204, 255, 0, 0.4)"
                                            }}
                                        >
                                            {isPlaying ? "⏸" : "▶"}
                                        </button>

                                        <div style={{ marginTop: "30px" }}>
                                            <button
                                                onClick={() => {
                                                    setAudioUrl(null);
                                                    setIsPlaying(false);
                                                }}
                                                style={{ background: "transparent", border: "none", color: "var(--foreground-muted)", cursor: "pointer", textDecoration: "underline" }}
                                            >
                                                End Session
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <audio
                            ref={audioRef}
                            src={audioUrl || ""}
                            onEnded={() => setIsPlaying(false)}
                            style={{ display: "none" }}
                        />
                    </div>
                </div>
            </div>
            <style jsx>{`
                @keyframes pulse {
                    0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.5; }
                    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
                    100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.5; }
                }
            `}</style>
        </DashboardLayout>
    );
}
