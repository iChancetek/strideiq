"use client";

import React from 'react';
import { Mic, Volume2, Square, Loader2 } from 'lucide-react';

interface SpeechControlsProps {
    onStartRecording?: () => void;
    onStopRecording?: () => void;
    onSpeak?: () => void;
    onStopSpeaking?: () => void;
    isRecording?: boolean;
    isTranscribing?: boolean;
    isPlaying?: boolean;
    size?: number;
    showMic?: boolean;
    showSpeaker?: boolean;
    label?: string;
    variant?: "minimal" | "standard" | "full";
}

export default function SpeechControls({
    onStartRecording,
    onStopRecording,
    onSpeak,
    onStopSpeaking,
    isRecording,
    isTranscribing,
    isPlaying,
    size = 18,
    showMic = true,
    showSpeaker = true,
    label,
    variant = "standard"
}: SpeechControlsProps) {

    const color = "var(--primary)";
    const mutedColor = "var(--foreground-muted)";

    return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            {showMic && (
                <button
                    onMouseDown={onStartRecording}
                    onMouseUp={onStopRecording}
                    onTouchStart={onStartRecording}
                    onTouchEnd={onStopRecording}
                    style={{
                        background: isRecording ? "rgba(255, 50, 50, 0.2)" : "rgba(255, 255, 255, 0.05)",
                        border: isRecording ? "1px solid #ff4444" : "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "50%",
                        width: size * 2.2,
                        height: size * 2.2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                    title="Hold to Record"
                >
                    {isTranscribing ? (
                        <Loader2 size={size} className="animate-spin" color={color} />
                    ) : (
                        <Mic size={size} color={isRecording ? "#ff4444" : mutedColor} />
                    )}
                </button>
            )}

            {showSpeaker && (
                <button
                    onClick={isPlaying ? onStopSpeaking : onSpeak}
                    style={{
                        background: isPlaying ? "rgba(204, 255, 0, 0.1)" : "rgba(255, 255, 255, 0.05)",
                        border: isPlaying ? "1px solid var(--primary)" : "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "50%",
                        width: size * 2.2,
                        height: size * 2.2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                    title={isPlaying ? "Stop Listening" : "Listen Out Loud"}
                >
                    {isPlaying ? (
                        <Square size={size - 4} color={color} fill={color} />
                    ) : (
                        <Volume2 size={size} color={mutedColor} />
                    )}
                </button>
            )}

            {label && (
                <span style={{ fontSize: "12px", color: mutedColor, fontWeight: 500 }}>{label}</span>
            )}
        </div>
    );
}
