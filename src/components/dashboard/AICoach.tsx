"use client";

import { useState, useRef, useEffect } from "react";
import { PERSONAS, PersonaId } from "@/lib/ai/personas";

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
    const [currentPersonaId, setCurrentPersonaId] = useState<PersonaId>("onyx");
    const activePersona = PERSONAS[currentPersonaId];

    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: `Hi! I'm ${activePersona.name}. How can I help you with your ${activePersona.role} today?` }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [voiceMode, setVoiceMode] = useState(false);
    const [thinkingDots, setThinkingDots] = useState(".");

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Animate thinking dots
    useEffect(() => {
        if (!loading) return;
        const interval = setInterval(() => {
            setThinkingDots(prev => prev.length >= 3 ? "." : prev + ".");
        }, 400);
        return () => clearInterval(interval);
    }, [loading]);

    // Initialize Speech Recognition
    useEffect(() => {
        const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
        if (webkitSpeechRecognition || SpeechRecognition) {
            const SpeechRecognitionConstructor = SpeechRecognition || webkitSpeechRecognition;
            const recognition = new SpeechRecognitionConstructor();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = "en-US";

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                sendMessage(transcript);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    // Text-to-Speech
    const speak = (text: string) => {
        if (!voiceMode || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"));
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
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
                if (voiceMode) speak(errorMsg);
            } else {
                const reply = data.message.content;
                setMessages(prev => [...prev, { role: "assistant", content: reply }]);
                if (voiceMode) speak(reply);
            }
        } catch (err) {
            console.error(err);
            const netError = "Network error. Please check your connection.";
            setMessages(prev => [...prev, { role: "assistant", content: netError }]);
            if (voiceMode) speak(netError);
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
                        width: 40, height: 40,
                        borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: isListening ? "var(--error)" : "rgba(255,255,255,0.05)",
                        color: isListening ? "#fff" : "var(--foreground-muted)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        cursor: "pointer",
                        fontSize: "16px",
                        transition: "all 0.2s ease"
                    }}
                >
                    🎤
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
