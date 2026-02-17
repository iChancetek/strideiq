"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
    role: "user" | "assistant";
    content: string;
};

export default function AICoach() {
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hi! I'm your StrideIQ Coach. How can I help you today?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            // Prepare message history for context
            const history = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: history }),
            });

            const data = await res.json();

            if (data.error) {
                setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I had trouble reaching the coaching server. Please try again." }]);
            } else {
                setMessages(prev => [...prev, { role: "assistant", content: data.message.content }]);
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: "assistant", content: "Network error. Please check your connection." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel" style={{
            display: "flex",
            flexDirection: "column",
            height: "500px",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden"
        }}>
            {/* Header */}
            <div style={{
                padding: "20px",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.02)",
                display: "flex",
                alignItems: "center",
                gap: "10px"
            }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--primary)" }}></div>
                <h3 style={{ fontSize: "16px" }}>AI Coach</h3>
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
                        background: msg.role === "user" ? "var(--primary)" : "rgba(255,255,255,0.1)",
                        color: msg.role === "user" ? "#000" : "#fff",
                        borderBottomRightRadius: msg.role === "user" ? "4px" : "16px",
                        borderBottomLeftRadius: msg.role === "assistant" ? "4px" : "16px",
                        lineHeight: 1.5
                    }}>
                        {msg.content}
                    </div>
                ))}
                {loading && (
                    <div style={{ alignSelf: "flex-start", color: "var(--foreground-muted)", fontSize: "12px", paddingLeft: "10px" }}>
                        Coach is thinking...
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
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Ask about your pace, recovery, or training..."
                    style={{
                        flex: 1,
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "var(--radius-full)",
                        padding: "12px 20px",
                        color: "#fff",
                        fontSize: "14px",
                        outline: "none"
                    }}
                />
                <button
                    onClick={sendMessage}
                    disabled={loading}
                    className="btn-primary"
                    style={{ padding: "10px 20px", fontSize: "14px" }}
                >
                    Send
                </button>
            </div>
        </div>
    );
}
