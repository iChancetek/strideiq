"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, Mic, Send, X, Bot, User, Loader2 } from "lucide-react";

interface Message {
    role: "assistant" | "user";
    content: string;
}

export default function ChancellorAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! I'm Chancellor. How can I help you with StrideIQ Elite today?", model: "GPT-5.3" }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        const newMessages: Message[] = [...messages, { role: "user", content: text }];
        setMessages(newMessages);
        setInputValue("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/ai/chancellor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text }),
            });

            const data = await response.json();
            if (data.response) {
                setMessages([...newMessages, { role: "assistant", content: data.response }]);
            } else {
                setMessages([...newMessages, { role: "assistant", content: "I'm sorry, I encountered an error. Please try again." }]);
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages([...newMessages, { role: "assistant", content: "Connection error. Please check your internet." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append("file", new File([audioBlob], "recording.webm"));

                setIsLoading(true);
                try {
                    const response = await fetch("/api/ai/transcribe", {
                        method: "POST",
                        body: formData,
                    });
                    const data = await response.json();
                    if (data.text) {
                        handleSendMessage(data.text);
                    }
                } catch (error) {
                    console.error("Transcription Error:", error);
                } finally {
                    setIsLoading(false);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Mic Access Error:", error);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 1000, fontFamily: "inherit" }}>
            {/* Chat Window */}
            {isOpen && (
                <div className="glass-panel" style={{
                    width: "350px",
                    height: "500px",
                    bottom: "80px",
                    right: "0",
                    position: "absolute",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "24px",
                    overflow: "hidden",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    animation: "slideUp 0.3s ease-out"
                }}>
                    {/* Header */}
                    <div style={{ padding: "20px", background: "rgba(204, 255, 0, 0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Bot size={18} color="#000" />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Chancellor</h4>
                                <span style={{ fontSize: "10px", color: "var(--primary)", fontWeight: 600, letterSpacing: "1px" }}>ELITE AI</span>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: "transparent", border: "none", color: "var(--foreground-muted)", cursor: "pointer" }}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                                maxWidth: "80%",
                                padding: "12px 16px",
                                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                background: msg.role === "user" ? "var(--primary)" : "rgba(255,255,255,0.05)",
                                color: msg.role === "user" ? "#000" : "#fff",
                                fontSize: "14px",
                                lineHeight: "1.5"
                            }}>
                                {msg.content}
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.05)", padding: "12px 16px", borderRadius: "16px 16px 16px 4px" }}>
                                <Loader2 className="animate-spin" size={16} />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{ padding: "20px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "10px", alignItems: "center" }}>
                        <button 
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onTouchStart={startRecording}
                            onTouchEnd={stopRecording}
                            style={{ 
                                background: isRecording ? "#ff4444" : "rgba(255,255,255,0.05)", 
                                border: "none", 
                                borderRadius: "50%", 
                                width: "40px", 
                                height: "40px", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            <Mic size={18} color={isRecording ? "#fff" : "var(--foreground-muted)"} />
                        </button>
                        <input 
                            type="text" 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
                            placeholder="Ask Chancellor..."
                            style={{ 
                                flex: 1, 
                                background: "rgba(255,255,255,0.05)", 
                                border: "none", 
                                padding: "10px 15px", 
                                borderRadius: "20px", 
                                color: "#fff",
                                fontSize: "14px",
                                outline: "none"
                            }}
                        />
                        <button 
                            onClick={() => handleSendMessage(inputValue)}
                            style={{ background: "var(--primary)", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                            <Send size={18} color="#000" />
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "30px",
                    background: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 10px 30px rgba(204, 255, 0, 0.3)",
                    border: "none",
                    cursor: "pointer",
                    transition: "transform 0.2s active:scale-95"
                }}
            >
                {isOpen ? <X size={24} color="#000" /> : <Bot size={28} color="#000" />}
            </button>

            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .text-gradient {
                    background: linear-gradient(135deg, #CCFF00 0%, #00FF85 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `}</style>
        </div>
    );
}
