"use client";

import { useState, useRef, useEffect } from "react";
import { PERSONAS, PersonaId } from "@/lib/ai/personas";
import { Mic, Send, Volume2, VolumeX, ArrowLeft } from "lucide-react";

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

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        // Try to find a good voice, otherwise default
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
            // Context window: last 10 messages
            const history = [...messages.slice(-10), userMsg].map(({ role, content }) => ({ role, content }));

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: history,
                    personaId: currentPersonaId
                }),
            });

            const data = await res.json();

            if (data.error || !res.ok) {
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
        <div className="flex flex-col h-[700px] w-full max-w-md mx-auto bg-black rounded-[32px] border border-white/10 overflow-hidden shadow-2xl relative">

            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-zinc-900/50 backdrop-blur-md">
                <div className="flex items-center justify-between mb-6">
                    <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <ArrowLeft size={20} className="text-white" />
                    </button>
                    <h1 className="text-2xl font-serif text-white ml-2">AI Performance Coach</h1>
                    <div className="w-10" /> {/* Spacer */}
                </div>

                {/* Active Persona Card */}
                <div className="flex items-center justify-between bg-zinc-800/50 rounded-2xl p-4 border border-white/5 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-xl">
                            {activePersona.avatar}
                        </div>
                        <div>
                            <div className="text-white font-bold text-sm">{activePersona.name}</div>
                            <div className="text-gray-400 text-xs">{activePersona.role}</div>
                        </div>
                    </div>
                    <button
                        onClick={() => setVoiceMode(!voiceMode)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${voiceMode ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/5 text-gray-400 border border-white/10"
                            }`}
                    >
                        {voiceMode ? <Volume2 size={14} /> : <VolumeX size={14} />}
                        {voiceMode ? "Voice On" : "Voice Off"}
                    </button>
                </div>

                {/* Persona Toggles */}
                <div className="flex gap-2 p-1 bg-black/40 rounded-xl overflow-x-auto">
                    {Object.values(PERSONAS).map((p) => (
                        <button
                            key={p.id}
                            onClick={() => changePersona(p.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${currentPersonaId === p.id
                                    ? `bg-[${p.color}] text-black shadow-lg shadow-[${p.color}]/20`
                                    : "text-gray-400 hover:bg-white/5"
                                }`}
                            style={{
                                backgroundColor: currentPersonaId === p.id ? p.color : "transparent",
                                color: currentPersonaId === p.id ? "#000" : undefined
                            }}
                        >
                            <span>{p.avatar}</span>
                            {p.name.split(" ")[0]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 bg-black relative">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none" />

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} relative z-10`}>
                        <div
                            className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                                    ? "bg-[#CCFF00] text-black font-medium border border-[#CCFF00] rounded-br-sm"
                                    : "bg-zinc-900 text-gray-200 border border-white/10 rounded-bl-sm"
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-zinc-900 border border-white/10 text-gray-400 text-xs px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-100" />
                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-200" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black/80 backdrop-blur-xl border-t border-white/10 absolute bottom-0 left-0 right-0 z-20">
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleListening}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isListening
                                ? "bg-red-500 text-white animate-pulse"
                                : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                            }`}
                    >
                        <Mic size={20} />
                    </button>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            placeholder={`Ask ${activePersona.name.split(" ")[0]}...`}
                            className="w-full bg-zinc-900 border border-white/10 text-white text-sm rounded-full py-3.5 pl-5 pr-12 focus:outline-none focus:border-[#CCFF00]/50 transition-colors placeholder:text-zinc-600"
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={loading || !input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#CCFF00] flex items-center justify-center text-black disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all"
                        >
                            <Send size={14} className="ml-0.5" />
                        </button>
                    </div>

                    {/* Menu/Settings placeholder */}
                    <button className="w-12 h-12 rounded-full bg-[#CCFF00] flex items-center justify-center text-black font-bold hover:scale-105 transition-transform">
                        =
                    </button>
                </div>
            </div>

            {/* Spacer for input area */}
            <div className="h-24" />
        </div>
    );
}
