"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Book, Calendar, Search, Feather, Sparkles } from "lucide-react";

interface JournalEntry {
    id: string;
    title: string;
    content: string;
    createdAt: string;
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
                const token = await user?.getIdToken();
                const res = await fetch("/api/journal/list", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setEntries(data.entries);
                }
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
        <div className="max-w-6xl mx-auto">
            <header className="mb-12 flex flex-col md:flex-row items-end justify-between gap-6">
                <div>
                    <div className="inline-flex items-center p-2 px-4 rounded-full bg-accent/10 border border-accent/20 mb-4 backdrop-blur-sm">
                        <Sparkles className="text-accent w-4 h-4 mr-2" />
                        <span className="text-accent font-bold tracking-wider text-xs uppercase">AI-Enhanced Reflection</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">
                        My <span className="text-gradient">Journal</span>
                    </h1>
                    <p className="text-foreground-muted max-w-lg">
                        Capture your thoughts, track your growth, and let AI refine your clarity.
                    </p>
                </div>
                <Link href="/dashboard/journal/new" className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                    <Plus size={20} strokeWidth={3} /> <span className="font-bold">New Entry</span>
                </Link>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="glass-panel h-64 animate-pulse rounded-2xl" />)}
                </div>
            ) : entries.length === 0 ? (
                <div className="glass-panel p-16 text-center flex flex-col items-center justify-center min-h-[400px] border border-dashed border-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
                    <div className="w-24 h-24 rounded-full bg-surface-hover flex items-center justify-center mb-6 relative z-10 border border-white/5">
                        <Feather size={48} className="text-foreground-muted opacity-50" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Your Story Begins Here</h3>
                    <p className="text-foreground-muted mb-8 max-w-sm text-lg">
                        Start your first entry. Whether it's a workout log or a midnight thought, we're here to listen.
                    </p>
                    <Link href="/dashboard/journal/new" className="btn-primary px-8 py-3 text-lg">
                        <Plus className="inline mr-2" size={20} /> Create First Entry
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Search Bar */}
                    <div className="relative max-w-md mx-auto md:mx-0 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-foreground-muted group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search your thoughts..."
                            className="block w-full pl-12 pr-4 py-4 rounded-2xl glass-panel bg-surface/50 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none text-foreground placeholder-foreground-muted/70"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Entries Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEntries.map((entry, idx) => (
                            <Link key={entry.id} href={`/dashboard/journal/${entry.id}`} className="group block h-full">
                                <article className="glass-panel p-6 h-full flex flex-col relative overflow-hidden hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5">

                                    {/* Decorative gradient header */}
                                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${idx % 3 === 0 ? 'from-primary to-accent' : idx % 3 === 1 ? 'from-accent to-purple-500' : 'from-blue-500 to-primary'} opacity-70`} />

                                    <div className="flex items-center gap-2 mb-4 text-xs font-mono text-foreground-muted uppercase tracking-wider">
                                        <Calendar size={12} className="text-primary" />
                                        {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </div>

                                    <h3 className="font-bold text-xl mb-3 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                        {entry.title || "Untitled Entry"}
                                    </h3>

                                    <p className="text-foreground-muted/80 text-sm leading-relaxed line-clamp-4 mb-6 flex-1">
                                        {entry.content || "No content..."}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2 text-xs text-foreground-muted group-hover:text-primary transition-colors">
                                            <Book size={14} />
                                            <span>Read Entry</span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all">
                                            <span className="text-lg leading-none mb-0.5">→</span>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
