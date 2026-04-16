"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PERSONAS, PersonaId } from "@/lib/ai/personas";
import { useVoice } from "@/hooks/useVoice";
import { Mic, Volume2 } from "lucide-react";

type Message = {
    role: "user" | "assistant" | "tool";
    content: string;
};

// Web Speech API Types
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

// ─────────────────────────────────────────────
// Rich Content Renderer
// Parses markdown-style links and embeds YouTube iframes
// ─────────────────────────────────────────────
function extractYouTubeId(url: string): string | null {
    try {
        const u = new URL(url);
        if (u.hostname.includes("youtube.com")) {
            return u.searchParams.get("v");
        }
        if (u.hostname === "youtu.be") {
            return u.pathname.slice(1);
        }
    } catch {
        // not a valid URL
    }
    return null;
}

function RenderRichContent({ text }: { text: string }) {
    // Split on markdown links: [title](url)
    const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);

    const elements: React.ReactNode[] = [];

    parts.forEach((part, idx) => {
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
            const [, title, url] = linkMatch;
            const ytId = extractYouTubeId(url);
            if (ytId) {
                // Render as embedded YouTube player
                elements.push(
                    <div key={idx} style={{ margin: "12px 0" }}>
                        <div style={{
                            fontSize: "12px",
                            color: "var(--foreground-muted)",
                            marginBottom: "6px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                        }}>
                            <span>▶</span>
                            <span style={{ fontWeight: 600 }}>{title}</span>
                        </div>
                        <div style={{
                            position: "relative",
                            width: "100%",
                            paddingTop: "56.25%",
                            borderRadius: "10px",
                            overflow: "hidden",
                            border: "1px solid rgba(255,255,255,0.15)"
                        }}>
                            <iframe
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    border: "none"
                                }}
                                src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                                title={title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                );
            } else {
                // Render as styled article link button
                elements.push(
                    <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            background: "rgba(255,255,255,0.07)",
                            border: "1px solid rgba(255,255,255,0.18)",
                            color: "var(--primary)",
                            fontSize: "13px",
                            fontWeight: 500,
                            textDecoration: "none",
                            transition: "background 0.2s ease",
                            verticalAlign: "middle",
                            margin: "2px 3px"
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.12)";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.07)";
                        }}
                    >
                        🔗 {title}
                    </a>
                );
            }
        } else if (part) {
            // Render plain text preserving line breaks
            const lines = part.split("\n");
            lines.forEach((line, lineIdx) => {
                if (lineIdx > 0) elements.push(<br key={`br-${idx}-${lineIdx}`} />);
                if (line) elements.push(<span key={`t-${idx}-${lineIdx}`}>{line}</span>);
            });
        }
    });

    return <>{elements}</>;
}

export default function AICoach() {
    const router = useRouter();
    const [currentPersonaId, setCurrentPersonaId] = useState<PersonaId>("onyx");
    const activePersona = PERSONAS[currentPersonaId];

    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: `Hi! I'm ${activePersona.name}. How can I help you with your ${activePersona.role} today?` }
    ]);
    const [input, setInput] = useState("");
    const {
        isPlaying,
        speak,
        stopSpeaking,
        isRecording,
        isTranscribing,
        startRecording,
        stopRecording
    } = useVoice();

    const [voiceMode, setVoiceMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [thinkingDots, setThinkingDots] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Animate thinking dots
    useEffect(() => {
        if (!loading) {
            setThinkingDots("");
            return;
        }
        const interval = setInterval(() => {
            setThinkingDots(prev => (prev.length >= 3 ? "" : prev + "."));
        }, 400);
        return () => clearInterval(interval);
    }, [loading]);

    // Text-to-Speech wrapper
    const handleSpeak = (text: string) => {
        if (!voiceMode) return;
        speak(text);
    };

    const toggleListening = async () => {
        if (isRecording) {
            const text = await stopRecording();
            if (text) {
                setInput(text);
                sendMessage(text);
            }
        } else {
            await startRecording();
        }
    };

    const changePersona = (id: PersonaId) => {
        setCurrentPersonaId(id);
        const newPersona = PERSONAS[id];
        const greeting = `Switched to ${newPersona.name} mode.`;
        setMessages([{ role: "assistant", content: greeting }]);
        if (voiceMode) speak(greeting);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (overrideInput?: string) => {
        const textToSend = overrideInput || input;
        if (!textToSend.trim() || loading) return;

        const userMsg: Message = { role: "user", content: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const history = [...messages.slice(-10), userMsg].map(({ role, content }) => ({ role, content }));

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: history, personaId: currentPersonaId }),
            });

            const data = await res.json();

            if (data.error || !res.ok) {
                const errorMsg = data.details || "Sorry, I had trouble reaching the coaching server.";
                setMessages(prev => [...prev, { role: "assistant", content: errorMsg }]);
                if (voiceMode) handleSpeak(errorMsg);
            } else {
                const reply = data.message.content;
                if (reply) {
                    setMessages(prev => [...prev, { role: "assistant", content: reply }]);
                    if (voiceMode) handleSpeak(reply);
                }

                if (data.message.uiAction) {
                    const action = data.message.uiAction;
                    setTimeout(() => {
                        if (action === "start_run") router.push("/dashboard/activities/new?type=run");
                        else if (action === "start_walk") router.push("/dashboard/activities/new?type=walk");
                        else if (action === "start_bike") router.push("/dashboard/activities/new?type=bike");
                        else if (action === "start_hike") router.push("/dashboard/activities/new?type=hike");
                        else if (action === "start_fast") router.push("/dashboard/fasting");
                        else if (action === "start_meditation") router.push("/dashboard/meditation");
                        else if (action === "open_journal") router.push("/dashboard/journal/new");
                        else if (action === "open_training") router.push("/dashboard/training/onboarding");
                    }, voiceMode ? 2000 : 0); // Give the AI time to speak before jumping
                }
            }
        } catch (err) {
            console.error(err);
            const netError = "Network error. Please check your connection.";
            setMessages(prev => [...prev, { role: "assistant", content: netError }]);
            if (voiceMode) handleSpeak(netError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel" style={{
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden"
        }}>
            {/* Header */}
            <div style={{
                padding: "20px",
                borderBottom: "1px solid rgba(255,255,255,0.1)"
            }}>
                {/* Persona Toggles */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                    {Object.values(PERSONAS).map((p) => (
                        <button
                            key={p.id}
                            onClick={() => changePersona(p.id)}
                            style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                padding: "8px 12px",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "12px",
                                fontWeight: 600,
                                border: currentPersonaId === p.id ? `1px solid ${p.color}` : "1px solid rgba(255,255,255,0.1)",
                                background: currentPersonaId === p.id ? p.color : "transparent",
                                color: currentPersonaId === p.id ? "#000" : "var(--foreground-muted)",
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                            }}
                        >
                            <span>{p.avatar}</span>
                            {p.name.split(" ")[0]}
                        </button>
                    ))}
                </div>

                {/* Active Persona Info */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                    color: "var(--foreground-muted)"
                }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {activePersona.name} — {activePersona.role}
                        <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            padding: "2px 7px",
                            borderRadius: "10px",
                            background: "rgba(204,255,0,0.1)",
                            border: "1px solid rgba(204,255,0,0.2)",
                            color: "#CCFF00",
                            fontSize: "10px",
                            fontWeight: 700,
                            letterSpacing: "0.04em"
                        }}>
                            🔍 SEARCH AI
                        </span>
                    </span>
                    <button
                        onClick={() => setVoiceMode(!voiceMode)}
                        style={{
                            padding: "4px 10px",
                            borderRadius: "var(--radius-full)",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                            background: voiceMode ? "rgba(255, 50, 50, 0.15)" : "rgba(255,255,255,0.05)",
                            color: voiceMode ? "var(--error)" : "var(--foreground-muted)",
                            border: voiceMode ? "1px solid rgba(255, 50, 50, 0.3)" : "1px solid rgba(255,255,255,0.1)",
                            transition: "all 0.2s ease"
                        }}
                    >
                        {voiceMode ? "🔊 Voice On" : "🔇 Voice Off"}
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div style={{
                flex: 1,
                padding: "20px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
            }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{
                        display: "flex",
                        justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
                    }}>
                        <div style={{
                            maxWidth: "85%",
                            padding: "12px 16px",
                            borderRadius: msg.role === "user" ? "var(--radius-md) var(--radius-md) 4px var(--radius-md)" : "var(--radius-md) var(--radius-md) var(--radius-md) 4px",
                            fontSize: "14px",
                            lineHeight: 1.6,
                            background: msg.role === "user" ? "var(--primary)" : "rgba(255,255,255,0.05)",
                            color: msg.role === "user" ? "#000" : "var(--foreground)",
                            fontWeight: msg.role === "user" ? 500 : 400,
                            border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.1)"
                        }}>
                            {msg.role === "assistant" ? (
                                <RenderRichContent text={msg.content} />
                            ) : (
                                msg.content
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div style={{ display: "flex", justifyContent: "flex-start" }}>
                        <div style={{
                            padding: "12px 16px",
                            borderRadius: "var(--radius-md)",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "var(--foreground-muted)",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}>
                            <span style={{
                                display: "inline-block",
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                background: activePersona.color,
                                animation: "pulse 1s ease-in-out infinite"
                            }} />
                            <span>Searching & thinking{thinkingDots}</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Intelligence Action Bar */}
            <div style={{
                padding: "0 20px 10px 20px",
                display: "flex",
                gap: "8px",
                flexWrap: "wrap"
            }}>
                <IntelligenceChip 
                    icon="🧬" 
                    label="Current Status" 
                    onClick={() => sendMessage("Analyze my current metabolic state and physiological readiness based on my recent sessions.")}
                />
                <IntelligenceChip 
                    icon="📜" 
                    label="Mindset Archive" 
                    onClick={() => sendMessage("Retrieve my recent Daily Mindsets and provide a deep dive into the neurological trends.")}
                />
                <IntelligenceChip 
                    icon="🎙️" 
                    label="Performance Brief" 
                    onClick={() => {
                        setVoiceMode(true);
                        sendMessage("Generate a high-level performance brief of my progress this week and read it out loud.");
                    }}
                />
                <IntelligenceChip 
                    icon="👥" 
                    label="Social Pulse" 
                    onClick={() => sendMessage("Compare my current metabolic and athletic standings with the local community leaderboards. Where can I gain a competitive edge?")}
                />
                <button
                    onClick={() => {
                        if (confirm("Clear chat history?")) {
                            setMessages([{ role: "assistant", content: `Clarity restored. How can I help you now, ${activePersona.name.split(" ")[0]}?` }]);
                        }
                    }}
                    style={{
                        background: "rgba(255,50,50,0.1)",
                        color: "#ff5555",
                        border: "1px solid rgba(255,50,50,0.2)",
                        padding: "6px 12px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    🗑️ Clear
                </button>
            </div>

            {/* Input Area */}
            <div style={{
                padding: "15px 20px",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                gap: "10px",
                alignItems: "center"
            }}>
                <button
                    onClick={toggleListening}
                    style={{
                        width: 44, height: 44,
                        borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: isRecording ? "rgba(255, 50, 50, 0.2)" : "rgba(255,255,255,0.05)",
                        color: isRecording ? "var(--error)" : "var(--foreground-muted)",
                        border: isRecording ? "1px solid var(--error)" : "1px solid rgba(255,255,255,0.1)",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                    }}
                >
                    {isTranscribing ? <div style={{ width: 16, height: 16, border: '2px solid', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" /> : <Mic size={20} />}
                </button>

                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={`Ask ${activePersona.name.split(" ")[0]}... (videos, articles, advice)`}
                    style={{
                        flex: 1,
                        padding: "10px 16px",
                        borderRadius: "var(--radius-full)",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "var(--foreground)",
                        fontSize: "14px",
                        outline: "none",
                        fontFamily: "var(--font-sans)"
                    }}
                />

                <button
                    onClick={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    style={{
                        padding: "10px 20px",
                        borderRadius: "var(--radius-full)",
                        background: "var(--primary)",
                        color: "#000",
                        fontWeight: 600,
                        fontSize: "13px",
                        border: "none",
                        cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                        opacity: loading || !input.trim() ? 0.5 : 1,
                        transition: "all 0.2s ease",
                        fontFamily: "var(--font-heading)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                    }}
                >
                    Send
                </button>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(0.7); }
                }
            `}</style>
        </div>
    );
}

function IntelligenceChip({ icon, label, onClick }: { icon: string, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--foreground-muted)",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap"
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "var(--foreground-muted)";
            }}
        >
            <span>{icon}</span> {label}
        </button>
    );
}
