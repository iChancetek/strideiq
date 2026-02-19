"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logOut } from "@/lib/firebase/auth";
import { useSettings } from "@/context/SettingsContext";

export default function VoiceCommandOverlay() {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const router = useRouter();
    const { user } = useAuth();
    const { updateSettings } = useSettings();

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                await processAudio(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setIsListening(true);
            setTranscript(null);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access is required for voice commands.");
        }
    };

    const stopListening = () => {
        if (mediaRecorderRef.current && isListening) {
            mediaRecorderRef.current.stop();
            setIsListening(false);
            setIsProcessing(true);
        }
    };

    const processAudio = async (audioBlob: Blob) => {
        const formData = new FormData();
        formData.append("file", audioBlob, "command.webm");

        try {
            const res = await fetch("/api/ai/voice-command", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            setIsProcessing(false);

            if (data.text) {
                setTranscript(data.text);
            }

            if (data.action) {
                executeAction(data.action);
            }
        } catch (error) {
            console.error("Voice command error:", error);
            setIsProcessing(false);
            setTranscript("Sorry, I encountered an error.");
        }
    };

    const executeAction = async (action: { type: string; params: any }) => {
        console.log("Executing Action:", action);

        // Voice Feedback
        if (action.params?.message && typeof window !== "undefined" && window.speechSynthesis) {
            const u = new SpeechSynthesisUtterance(action.params.message);
            window.speechSynthesis.speak(u);
        }

        switch (action.type) {
            case "start_session":
                if (action.params.mode) {
                    await updateSettings({ activityMode: action.params.mode });
                }
                router.push("/dashboard/run");
                break;
            case "logout":
                await logOut();
                router.push("/login");
                break;
            case "navigate":
                if (action.params.path) {
                    router.push(action.params.path);
                }
                break;
            default:
                break;
        }
    };

    return (
        <div style={{ position: "fixed", bottom: "30px", right: "30px", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "end", gap: "10px" }}>

            {/* Transcript Bubble */}
            {(transcript || isProcessing) && (
                <div className="glass-panel" style={{
                    padding: "12px 20px",
                    borderRadius: "20px",
                    marginBottom: "10px",
                    maxWidth: "300px",
                    background: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid var(--primary)",
                    color: "white",
                    fontSize: "14px",
                    animation: "fadeIn 0.3s ease"
                }}>
                    {isProcessing ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            Processing... <span className="spinner" />
                        </span>
                    ) : (
                        `"${transcript}"`
                    )}
                </div>
            )}

            {/* Mic Button */}
            <button
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onTouchStart={(e) => { e.preventDefault(); startListening(); }}
                onTouchEnd={(e) => { e.preventDefault(); stopListening(); }}
                className="btn-primary"
                style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    boxShadow: isListening ? "0 0 30px var(--primary)" : "0 4px 20px rgba(0,0,0,0.5)",
                    transform: isListening ? "scale(1.1)" : "scale(1)",
                    transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    border: "none",
                    background: isListening ? "#ff4444" : "var(--primary)",
                    color: isListening ? "white" : "black"
                }}
            >
                {isListening ? "⏹" : "🎙"}
            </button>
            <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .spinner {
                    width: 12px; height: 12px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    display: inline-block;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
