"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/config";
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot, 
    addDoc, 
    deleteDoc, 
    doc, 
    getDocs, 
    setDoc,
    getDoc,
    Timestamp,
    writeBatch
} from "firebase/firestore";
import { playIQVoice } from "@/lib/utils/audio";
import { 
    Brain, 
    History, 
    Volume2, 
    VolumeX, 
    Trash2, 
    Share2, 
    Plus, 
    X,
    ChevronRight,
    Loader2,
    Calendar
} from "lucide-react";

const SYSTEM_QUOTES = [
    "Run the mile you are in.",
    "Your only competition is who you were yesterday.",
    "Pain is temporary. Pride is forever.",
    "Clear your mind, fill your lungs, find your rhythm.",
    "Every step is a victory.",
    "Elite performance starts with elite thoughts.",
    "Embrace the struggle, enjoy the strength.",
    "Find comfort in the uncomfortable.",
    "Greatness is a series of small wins compounded.",
    "Breath is the link between body and mind."
];

interface MindsetEntry {
    id: string;
    text: string;
    createdAt: Timestamp;
}

export default function EliteMindset() {
    const { user } = useAuth();
    const [currentMindset, setCurrentMindset] = useState<MindsetEntry | null>(null);
    const [history, setHistory] = useState<MindsetEntry[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isDeepDiving, setIsDeepDiving] = useState(false);
    const [deepDiveText, setDeepDiveText] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(true);

    const todayId = new Date().toISOString().split('T')[0];

    // Listen for history
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "users", user.uid, "mindsets"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as MindsetEntry));
            
            setHistory(items);
            
            // Set current mindset (either today's or the latest)
            const today = items.find(i => i.id === todayId);
            if (today) {
                setCurrentMindset(today);
            } else if (!currentMindset && items.length > 0) {
                // If no today's, but we have history, show nothing or generate?
                // For MVP, if today is missing, we will generate it below.
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, todayId]);

    // Generate today's mindset if missing
    useEffect(() => {
        if (!loading && !currentMindset && user) {
            generateNewMindset();
        }
    }, [loading, currentMindset, user]);

    const generateNewMindset = async () => {
        if (!user) return;
        const randomQuote = SYSTEM_QUOTES[Math.floor(Math.random() * SYSTEM_QUOTES.length)];
        
        try {
            const newRef = doc(db, "users", user.uid, "mindsets", todayId);
            await setDoc(newRef, {
                text: randomQuote,
                createdAt: Timestamp.now()
            });
        } catch (e) {
            console.error("Error generating mindset:", e);
        }
    };

    const handleListen = async (text: string) => {
        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            return;
        }

        setIsPlaying(true);
        await playIQVoice(text);
        setIsPlaying(false);
    };

    const handleDeepDive = async (text: string) => {
        if (isDeepDiving) {
            setDeepDiveText(null);
            setIsDeepDiving(false);
            return;
        }

        setIsDeepDiving(true);
        try {
            const prompt = `Provide a scientific and psychological deep dive for this elite mindset quote: "${text}". Explain the metabolic, neurological, or performance benefits of this perspective in 3 concise paragraphs. Use a professional, coaching tone.`;
            const res = await fetch("/api/ai/chancellor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: prompt }),
            });
            const data = await res.json();
            if (data.response) {
                setDeepDiveText(data.response);
            }
        } catch (e) {
            console.error("Deep dive error:", e);
        } finally {
            // keep state active to show the text
        }
    };

    const handleShare = async (text: string) => {
        const shareData = {
            title: 'StrideIQ Daily Mindset',
            text: `Elite Mindset of the Day: "${text}"`,
            url: window.location.origin
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                alert("Copied to clipboard!");
            }
        } catch (e) {
            console.error("Share error:", e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        if (!confirm("Are you sure you want to delete this mindset entry?")) return;

        try {
            await deleteDoc(doc(db, "users", user.uid, "mindsets", id));
            if (currentMindset?.id === id) setCurrentMindset(null);
        } catch (e) {
            console.error("Delete error:", e);
        }
    };

    const handleDeleteAll = async () => {
        if (!user) return;
        if (!confirm("CRITICAL: Delete all mindset history permanently?")) return;

        try {
            const batch = writeBatch(db);
            history.forEach(item => {
                batch.delete(doc(db, "users", user.uid, "mindsets", item.id));
            });
            await batch.commit();
            setCurrentMindset(null);
            setShowHistory(false);
        } catch (e) {
            console.error("Delete all error:", e);
        }
    };

    if (!user) return null;

    return (
        <div style={{ position: "relative" }}>
            <div className="glass-panel" style={{
                padding: "30px",
                borderRadius: "var(--radius-lg)",
                textAlign: "center",
                background: "linear-gradient(135deg, rgba(204, 255, 0, 0.05), rgba(0, 0, 0, 0))",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                display: "flex",
                flexDirection: "column",
                gap: "20px"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: "11px", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "2px", margin: 0 }}>
                            Daily Mindset
                        </h3>
                        <div style={{ fontSize: '10px', color: 'var(--foreground-muted)', marginTop: '2px' }}>
                            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowHistory(true)}
                        className="btn-ghost" 
                        style={{ padding: '8px', borderRadius: '50%' }}
                    >
                        <History size={18} />
                    </button>
                </div>

                <div style={{ minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {loading ? (
                        <Loader2 className="animate-spin" size={24} color="var(--primary)" />
                    ) : (
                        <p style={{ 
                            fontSize: "22px", 
                            fontStyle: "italic", 
                            fontFamily: "var(--font-heading)", 
                            lineHeight: 1.4,
                            margin: 0,
                            animation: 'fadeIn 0.5s ease'
                        }}>
                            "{currentMindset?.text}"
                        </p>
                    )}
                </div>

                {/* Main Actions */}
                <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                    <button 
                        onClick={() => handleListen(currentMindset?.text || "")}
                        style={{ 
                            width: '44px', height: '44px', borderRadius: '50%', 
                            background: isPlaying ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.2s',
                            color: isPlaying ? '#000' : '#fff'
                        }}
                        title="Listen Out Loud"
                    >
                        {isPlaying ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <button 
                        onClick={() => handleDeepDive(currentMindset?.text || "")}
                        style={{ 
                            width: '44px', height: '44px', borderRadius: '50%', 
                            background: isDeepDiving ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.2s',
                            color: isDeepDiving ? '#000' : '#fff'
                        }}
                        title="AI Deep Dive"
                    >
                        <Brain size={18} />
                    </button>
                    <button 
                        onClick={() => handleShare(currentMindset?.text || "")}
                        style={{ 
                            width: '44px', height: '44px', borderRadius: '50%', 
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        <Share2 size={18} />
                    </button>
                </div>

                {/* Deep Dive Panel */}
                {isDeepDiving && (
                    <div style={{ 
                        marginTop: '10px', 
                        padding: '20px', 
                        background: 'rgba(0,0,0,0.2)', 
                        borderRadius: '16px',
                        border: '1px solid rgba(204, 255, 0, 0.2)',
                        textAlign: 'left',
                        animation: 'slideDown 0.3s ease'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 800, letterSpacing: '1px' }}>METABOLIC INTELLIGENCE REPORT</span>
                            <button onClick={() => setIsDeepDiving(false)} style={{ background: 'none', border: 'none', color: 'var(--foreground-muted)', cursor: 'pointer' }}>
                                <X size={14} />
                            </button>
                        </div>
                        {deepDiveText ? (
                            <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--foreground-muted)', whiteSpace: 'pre-wrap' }}>
                                {deepDiveText}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground-muted)', fontSize: '13px' }}>
                                <Loader2 className="animate-spin" size={14} /> Analysing neurological triggers...
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* History Modal/Overlay */}
            {showHistory && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 2000,
                    background: "rgba(0,0,0,0.8)",
                    backdropFilter: "blur(12px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px"
                }}>
                    <div className="glass-panel" style={{
                        width: "100%",
                        maxWidth: "500px",
                        maxHeight: "80vh",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: "28px",
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.1)",
                        animation: "scaleIn 0.3s ease"
                    }}>
                        {/* Header */}
                        <div style={{ padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "20px" }}>Mindset History</h3>
                                <p style={{ fontSize: "12px", color: "var(--foreground-muted)", margin: 0 }}>Retrieve and analyze past thoughts.</p>
                            </div>
                            <button onClick={() => setShowHistory(false)} className="btn-ghost" style={{ padding: '8px', borderRadius: '50%' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* List */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {history.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--foreground-muted)' }}>
                                        No elite mindset history yet.
                                    </div>
                                ) : (
                                    history.map((item) => (
                                        <div key={item.id} className="glass-panel" style={{
                                            padding: "16px",
                                            background: "rgba(255,255,255,0.03)",
                                            borderRadius: "16px",
                                            border: "1px solid rgba(255,255,255,0.03)",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "12px"
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                                                    <Calendar size={12} />
                                                    {item.createdAt?.toDate().toLocaleString(undefined, { 
                                                        month: 'short', 
                                                        day: 'numeric', 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })}
                                                </div>
                                                <button 
                                                    onClick={() => handleDelete(item.id)}
                                                    style={{ background: 'none', border: 'none', color: 'rgba(255,50,50,0.5)', cursor: 'pointer' }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <p style={{ margin: 0, fontSize: "14px", fontStyle: 'italic', lineHeight: 1.4 }}>
                                                "{item.text}"
                                            </p>
                                            <div style={{ display: "flex", gap: "12px", marginTop: '4px' }}>
                                                <button 
                                                    onClick={() => handleListen(item.text)}
                                                    style={{ background: 'none', border: 'none', color: 'var(--foreground-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                                >
                                                    <Volume2 size={12} /> Listen
                                                </button>
                                                <button 
                                                    onClick={() => handleShare(item.text)}
                                                    style={{ background: 'none', border: 'none', color: 'var(--foreground-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                                >
                                                    <Share2 size={12} /> Share
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        {history.length > 0 && (
                            <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.1)", background: 'rgba(255,50,50,0.05)' }}>
                                <button 
                                    onClick={handleDeleteAll}
                                    style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid rgba(255,50,50,0.2)', color: '#ff5555', borderRadius: '12px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Clear All History
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
