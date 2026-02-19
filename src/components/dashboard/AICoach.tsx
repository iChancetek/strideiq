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

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

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
                    <span>{activePersona.name} — {activePersona.role}</span>
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
                            maxWidth: "80%",
                            padding: "12px 16px",
                            borderRadius: msg.role === "user" ? "var(--radius-md) var(--radius-md) 4px var(--radius-md)" : "var(--radius-md) var(--radius-md) var(--radius-md) 4px",
                            fontSize: "14px",
                            lineHeight: 1.5,
                            background: msg.role === "user" ? "var(--primary)" : "rgba(255,255,255,0.05)",
                            color: msg.role === "user" ? "#000" : "var(--foreground)",
                            fontWeight: msg.role === "user" ? 500 : 400,
                            border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.1)"
                        }}>
                            {msg.content}
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
                            fontSize: "14px"
                        }}>
                            Thinking...
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
                    placeholder={`Ask ${activePersona.name.split(" ")[0]}...`}
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
        </div>
    );
}
