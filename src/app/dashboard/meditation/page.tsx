"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useRef, useEffect } from "react";

const TRACKS = [
    { id: "focus", label: "Deep Focus", src: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3", color: "#CCFF00" }, // Ambient Piano
    { id: "recovery", label: "Post-Run Recovery", src: "https://cdn.pixabay.com/audio/2024/09/09/audio_248674253c.mp3", color: "#00E5FF" }, // Gentle Stream
    { id: "sleep", label: "Sleep Aid", src: "https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3", color: "#9D4EDD" }, // Deep Drone
];

const DURATIONS = [10, 15, 20, 30];

export default function MeditationPage() {
    // Configuration State
    const [selectedTrack, setSelectedTrack] = useState(TRACKS[0]);
    const [durationMinutes, setDurationMinutes] = useState(10);

    // Audio State
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);

    // Session State
    const [isActive, setIsActive] = useState(false); // Timer running?
    const [isPaused, setIsPaused] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(10 * 60);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Sync Volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && !isPaused && secondsLeft > 0) {
            interval = setInterval(() => {
                setSecondsLeft((prev) => prev - 1);
            }, 1000);
        } else if (secondsLeft === 0) {
            setIsActive(false);
            setIsPaused(false);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            alert("Session Complete. Namaste. 🙏");
        }

        return () => clearInterval(interval);
    }, [isActive, isPaused, secondsLeft]);

    // Handle Start
    const startSession = () => {
        if (!isActive) {
            setSecondsLeft(durationMinutes * 60);
        }
        setIsActive(true);
        setIsPaused(false);
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume; // Set volume before playing
            audioRef.current.play().catch(e => console.log("Audio play failed (user interaction needed first)"));
        }
    };

    // Handle Pause
    const pauseSession = () => {
        setIsPaused(true);
        if (audioRef.current) audioRef.current.pause();
    };

    // Handle Resume
    const resumeSession = () => {
        setIsPaused(false);
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume; // Set volume before playing
            audioRef.current.play();
        }
    };

    // Handle Stop/Reset
    const stopSession = () => {
        setIsActive(false);
        setIsPaused(false);
        setSecondsLeft(durationMinutes * 60);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    // Helper to format time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", padding: "20px" }}>
                <header style={{ marginBottom: "40px" }}>
                    <h1 style={{ fontSize: "36px", marginBottom: "10px" }}>Mindset & Recovery</h1>
                    <p style={{ color: "var(--foreground-muted)", fontSize: "18px" }}>
                        Center your mind before the run, or recover after.
                    </p>
                </header>

                <div className="glass-panel" style={{
                    padding: "40px",
                    borderRadius: "var(--radius-lg)",
                    position: "relative",
                    overflow: "hidden",
                    border: `1px solid ${isActive ? selectedTrack.color : "transparent"}`,
                    transition: "border 0.5s ease"
                }}>

                    {/* Visualizer Background */}
                    {isActive && !isPaused && (
                        <div className="breathing-circle" style={{ borderColor: selectedTrack.color }}></div>
                    )}

                    <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "30px" }}>

                        {/* 1. Track Selection */}
                        {!isActive && (
                            <div>
                                <label style={{ display: "block", marginBottom: "15px", fontWeight: 600, color: "var(--primary)", letterSpacing: "1px" }}>
                                    🎵 BACKGROUND MUSIC
                                </label>
                                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
                                    {TRACKS.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setSelectedTrack(t)}
                                            style={{
                                                padding: "12px 24px",
                                                borderRadius: "var(--radius-full)",
                                                border: selectedTrack.id === t.id ? `2px solid ${t.color}` : "1px solid rgba(255,255,255,0.1)",
                                                background: selectedTrack.id === t.id ? `${t.color}20` : "rgba(255,255,255,0.05)",
                                                color: selectedTrack.id === t.id ? "#fff" : "var(--foreground-muted)",
                                                fontWeight: selectedTrack.id === t.id ? 700 : 400,
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px"
                                            }}
                                        >
                                            {selectedTrack.id === t.id && <span>▶</span>}
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. Duration Selection */}
                        {!isActive && (
                            <div>
                                <label style={{ display: "block", marginBottom: "15px", fontWeight: 600, color: "var(--foreground-muted)" }}>DURATION (MIN)</label>
                                <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
                                    {DURATIONS.map((min) => (
                                        <button
                                            key={min}
                                            onClick={() => setDurationMinutes(min)}
                                            style={{
                                                width: "60px",
                                                height: "60px",
                                                borderRadius: "50%",
                                                border: `2px solid ${durationMinutes === min ? "var(--primary)" : "rgba(255,255,255,0.1)"}`,
                                                background: durationMinutes === min ? "var(--primary)" : "transparent",
                                                color: durationMinutes === min ? "#000" : "var(--foreground)",
                                                fontWeight: 700,
                                                fontSize: "18px",
                                                cursor: "pointer",
                                                transition: "all 0.2s"
                                            }}
                                        >
                                            {min}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. Timer Display */}
                        <div style={{ margin: "20px 0" }}>
                            <div style={{
                                fontSize: "80px",
                                fontWeight: 700,
                                fontVariantNumeric: "tabular-nums",
                                textShadow: isActive ? `0 0 30px ${selectedTrack.color}40` : "none",
                                transition: "text-shadow 0.5s"
                            }}>
                                {isActive ? formatTime(secondsLeft) : `${durationMinutes}:00`}
                            </div>
                            <div style={{ color: selectedTrack.color, fontWeight: 600, display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                                {isActive && !isPaused && <span className="animate-spin">💿</span>}
                                {isActive ? (isPaused ? "PAUSED" : `PLAYING: ${selectedTrack.label.toUpperCase()}`) : "READY"}
                            </div>
                        </div>

                        {/* 4. Controls & Volume */}
                        <div>
                            {/* Main Session Controls */}
                            <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "30px" }}>
                                {!isActive ? (
                                    <button
                                        className="btn-primary"
                                        onClick={startSession}
                                        style={{ minWidth: "200px", fontSize: "18px", padding: "16px 32px" }}
                                    >
                                        Start Session
                                    </button>
                                ) : (
                                    <>
                                        {isPaused ? (
                                            <button
                                                onClick={resumeSession}
                                                style={{
                                                    background: "var(--primary)", color: "#000", border: "none",
                                                    padding: "16px 32px", borderRadius: "12px", fontSize: "18px", fontWeight: 600, cursor: "pointer"
                                                }}
                                            >
                                                Resume
                                            </button>
                                        ) : (
                                            <button
                                                onClick={pauseSession}
                                                style={{
                                                    background: "rgba(255,255,255,0.1)", color: "#fff", border: "none",
                                                    padding: "16px 32px", borderRadius: "12px", fontSize: "18px", fontWeight: 600, cursor: "pointer"
                                                }}
                                            >
                                                Pause
                                            </button>
                                        )}

                                        <button
                                            onClick={stopSession}
                                            style={{
                                                background: "rgba(255, 50, 50, 0.2)", color: "#ff3333", border: "1px solid rgba(255, 50, 50, 0.5)",
                                                padding: "16px 32px", borderRadius: "12px", fontSize: "18px", fontWeight: 600, cursor: "pointer"
                                            }}
                                        >
                                            Stop
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Volume Control (Only visible when Active) */}
                            {isActive && (
                                <div style={{
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "15px",
                                    background: "rgba(0,0,0,0.2)", padding: "15px", borderRadius: "16px",
                                    maxWidth: "400px", margin: "0 auto"
                                }}>
                                    <button
                                        onClick={() => setIsMuted(!isMuted)}
                                        style={{ background: "transparent", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }}
                                    >
                                        {isMuted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
                                    </button>

                                    <input
                                        type="range"
                                        min="0" max="1" step="0.01"
                                        value={isMuted ? 0 : volume}
                                        onChange={(e) => {
                                            setVolume(parseFloat(e.target.value));
                                            if (parseFloat(e.target.value) > 0) setIsMuted(false);
                                        }}
                                        style={{ width: "100%", accentColor: selectedTrack.color, cursor: "pointer" }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Hidden Audio Player */}
                        <audio
                            ref={audioRef}
                            src={selectedTrack.src}
                            loop
                            onError={(e) => {
                                console.error("Audio Missing:", e);
                                alert(`Could not play '${selectedTrack.label}'. Ensure internet connection is active.`);
                            }}
                        />

                    </div>
                </div>

                <p style={{ marginTop: "40px", opacity: 0.5, fontSize: "14px" }}>
                    Tip: Use headphones for the best immersive experience.
                </p>
            </div>

            <style jsx>{`
                .breathing-circle {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 300px;
                    height: 300px;
                    border-radius: 50%;
                    border: 2px solid;
                    opacity: 0.3;
                    animation: breathe 8s infinite ease-in-out;
                    pointer-events: none;
                }
                @keyframes breathe {
                    0%, 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.1; }
                    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.4; }
                }
            `}</style>
        </DashboardLayout>
    );
}
