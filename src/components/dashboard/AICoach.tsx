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
                sendMessage(transcript); // Auto-send on voice input
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

        // Cancel current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        // Try to select a voice based on persona if possible, else default
        const voices = window.speechSynthesis.getVoices();

        // Simple heuristic for voice selection (Male vs Female sounding if available)
        // This is browser dependent, so we just stick to default for reliability for now
        // or iterate to find a better one.

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

    // Reset chat when persona changes
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
            const history = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: history,
                    personaId: currentPersonaId
                }),
            });

            const data = await res.json();

            if (data.error) {
                const errorMsg = "Sorry, I had trouble reaching the coaching server.";
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
            display: "flex",
            flexDirection: "column",
            height: "600px",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            border: `1px solid ${activePersona.color}50`
        }}>
            {/* Header with Persona Selector & Voice Toggle */}
            <div style={{
                padding: "15px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.02)",
                display: "flex",
                flexDirection: "column",
                gap: "10px"
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                            fontSize: "24px",
                            background: "rgba(255,255,255,0.1)",
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            {activePersona.avatar}
                        </div>
                        <div>
                            <h3 style={{ fontSize: "16px", margin: 0 }}>{activePersona.name}</h3>
                            <p style={{ fontSize: "12px", color: "var(--foreground-muted)", margin: 0 }}>{activePersona.role}</p>
                        </div>
                    </div>

                    {/* Voice Mode Toggle */}
                    <button
                        onClick={() => setVoiceMode(!voiceMode)}
                        style={{
                            background: voiceMode ? "var(--primary)" : "rgba(255,255,255,0.1)",
                            color: voiceMode ? "#000" : "var(--foreground)",
                            border: "none",
                            borderRadius: "20px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px"
                        }}
                    >
                        {voiceMode ? "🔊 Voice On" : "🔇 Voice Off"}
                    </button>
                </div>

                {/* Persona Tabs */}
                <div style={{ display: "flex", gap: "5px", background: "rgba(0,0,0,0.2)", padding: "4px", borderRadius: "12px" }}>
                    {Object.values(PERSONAS).map((p) => (
                        <button
                            key={p.id}
                            onClick={() => changePersona(p.id)}
                            style={{
                                flex: 1,
                                padding: "8px",
                                border: "none",
                                background: currentPersonaId === p.id ? p.color : "transparent",
                                color: currentPersonaId === p.id ? "#000" : "var(--foreground-muted)",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            {p.avatar} {p.name.split(" ")[0]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1,
                padding: "20px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "15px"
            }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{
                        alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                        maxWidth: "80%",
                        padding: "12px 16px",
                        borderRadius: "16px",
                        background: msg.role === "user" ? activePersona.color : "var(--surface)",
                        color: msg.role === "user" ? "#000" : "var(--foreground)",
                        border: msg.role !== "user" ? "1px solid rgba(255,255,255,0.1)" : "none",
                        borderBottomRightRadius: msg.role === "user" ? "4px" : "16px",
                        borderBottomLeftRadius: msg.role === "assistant" ? "4px" : "16px",
                        lineHeight: 1.5,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}>
                        {msg.content}
                    </div>
                ))}
                {loading && (
                    <div style={{ alignSelf: "flex-start", color: "var(--foreground-muted)", fontSize: "12px", paddingLeft: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="animate-pulse">●</span>
                        <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span>
                        <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
                padding: "20px",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                gap: "10px"
            }}>
                {/* Mic Button */}
                <button
                    onClick={toggleListening}
                    style={{
                        background: isListening ? "var(--error)" : "rgba(255,255,255,0.1)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: "44px",
                        height: "44px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "20px"
                    }}
                    title={isListening ? "Stop Listening" : "Start Voice Input"}
                >
                    {isListening ? "⏹️" : "mic"}
                </button>

                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={`Ask ${activePersona.name.split(" ")[0]}...`}
                    style={{
                        flex: 1,
                        background: "var(--surface)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "var(--radius-full)",
                        padding: "12px 20px",
                        color: "var(--foreground)",
                        fontSize: "14px",
                        outline: "none"
                    }}
                />
                <button
                    onClick={() => sendMessage()}
                    disabled={loading}
                    className="btn-primary"
                    style={{
                        padding: "10px 20px",
                        fontSize: "14px",
                        background: activePersona.color,
                        color: "#000"
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    );
}
