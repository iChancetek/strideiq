"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

interface JournalEntry {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    imageUrls?: string[];
    media?: { type: string, url: string }[];
}

export default function JournalDashboard() {
    const { user } = useAuth();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!user) return;

        async function fetchEntries() {
            try {
                const q = query(
                    collection(db, "users", user!.uid, "journal_entries"),
                    orderBy("createdAt", "desc"),
                    limit(50)
                );
                const snapshot = await getDocs(q);

                const fetchedEntries = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                    } as JournalEntry;
                });

                setEntries(fetchedEntries);
            } catch (e) {
                console.error("Failed to fetch journal", e);
            } finally {
                setLoading(false);
            }
        }
        fetchEntries();
    }, [user]);

    const filteredEntries = entries.filter(entry =>
        entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 16px", paddingBottom: "40px" }}>
            {/* Header */}
            <header style={{ marginBottom: "32px" }}>
                <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "8px 16px",
                    borderRadius: "var(--radius-full, 24px)",
                    background: "rgba(204,255,0,0.1)",
                    border: "1px solid rgba(204,255,0,0.2)",
                    marginBottom: "12px",
                }}>
                    <span style={{ marginRight: "8px" }}>✨</span>
                    <span style={{ color: "var(--primary)", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>AI-Enhanced Reflection</span>
                </div>
                <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, marginBottom: "8px" }}>
                    My <span style={{ color: "var(--primary)" }}>Journal</span>
                </h1>
                <p style={{ color: "var(--foreground-muted)", maxWidth: "480px", fontSize: "15px", lineHeight: "1.5" }}>
                    Capture your thoughts, track your growth, and let AI refine your clarity.
                </p>
                <Link href="/dashboard/journal/new" className="btn-primary" style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "16px",
                    padding: "12px 24px",
                    borderRadius: "var(--radius-full, 24px)",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: "14px",
                }}>
                    + New Entry
                </Link>
            </header>

            {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-panel" style={{ height: "200px", borderRadius: "16px", animation: "pulse 1.5s infinite" }} />
                    ))}
                </div>
            ) : entries.length === 0 ? (
                <div className="glass-panel" style={{
                    padding: "60px 24px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "300px",
                    borderRadius: "16px",
                    border: "1px dashed rgba(255,255,255,0.1)",
                }}>
                    <div style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "20px",
                        fontSize: "36px",
                    }}>
                        🪶
                    </div>
                    <h3 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Your Story Begins Here</h3>
                    <p style={{ color: "var(--foreground-muted)", marginBottom: "24px", maxWidth: "320px", fontSize: "15px", lineHeight: "1.5" }}>
                        Start your first entry. Whether it&apos;s a workout log or a midnight thought, we&apos;re here to listen.
                    </p>
                    <Link href="/dashboard/journal/new" className="btn-primary" style={{
                        padding: "12px 28px",
                        borderRadius: "var(--radius-full, 24px)",
                        textDecoration: "none",
                        fontWeight: 700,
                        fontSize: "15px",
                    }}>
                        + Create First Entry
                    </Link>
                </div>
            ) : (
                <div>
                    {/* Search Bar */}
                    <div style={{ position: "relative", maxWidth: "400px", marginBottom: "24px" }}>
                        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", color: "var(--foreground-muted)" }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search your thoughts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "14px 16px 14px 42px",
                                borderRadius: "16px",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#fff",
                                fontSize: "14px",
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    {/* Entries Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                        {filteredEntries.map((entry, idx) => (
                            <Link key={entry.id} href={`/dashboard/journal/${entry.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                                <article className="glass-panel" style={{
                                    padding: "20px",
                                    borderRadius: "16px",
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    position: "relative",
                                    overflow: "hidden",
                                    transition: "transform 0.2s, border-color 0.2s",
                                }}>
                                    {/* Top accent bar */}
                                    <div style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "3px",
                                        background: idx % 3 === 0 ? "linear-gradient(90deg, var(--primary), #00ffaa)" : idx % 3 === 1 ? "linear-gradient(90deg, #00ffaa, #a855f5)" : "linear-gradient(90deg, #3b82f6, var(--primary))",
                                        opacity: 0.7,
                                    }} />

                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", fontSize: "11px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                                        📅 {new Date(entry.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                                        {/* Media Indicators */}
                                        <div style={{ marginLeft: "auto", display: "flex", gap: "4px", fontSize: "14px" }}>
                                            {(entry.imageUrls?.length || 0) > 0 || entry.media?.some(m => m.type === "image") ? "📷" : ""}
                                            {entry.media?.some(m => m.type === "audio") ? "🎤" : ""}
                                            {entry.media?.some(m => m.type === "video") ? "📹" : ""}
                                        </div>
                                    </div>

                                    <h3 style={{ fontWeight: 700, fontSize: "18px", marginBottom: "10px", lineHeight: "1.3" }}>
                                        {entry.title || "Untitled Entry"}
                                    </h3>

                                    <p style={{
                                        color: "var(--foreground-muted)",
                                        fontSize: "13px",
                                        lineHeight: "1.5",
                                        flex: 1,
                                        overflow: "hidden",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 4,
                                        WebkitBoxOrient: "vertical",
                                        marginBottom: "16px",
                                    }}>
                                        {entry.content || "No content..."}
                                    </p>

                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        paddingTop: "12px",
                                        borderTop: "1px solid rgba(255,255,255,0.05)",
                                    }}>
                                        <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>📖 Read Entry</span>
                                        <span style={{ fontSize: "16px", color: "var(--foreground-muted)" }}>→</span>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
            `}</style>
        </div>
    );
}
