"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Book, Calendar, Search } from "lucide-react";

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
        <div className="max-w-4xl mx-auto">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">My Journal</h1>
                    <p className="text-foreground-muted">Reflect, plan, and grow with AI assistance.</p>
                </div>
                <Link href="/dashboard/journal/new" className="btn-primary flex items-center gap-2">
                    <Plus size={18} /> New Entry
                </Link>
            </header>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="glass-panel h-24 animate-pulse" />)}
                </div>
            ) : entries.length === 0 ? (
                <div className="glass-panel p-12 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mb-4">
                        <Book size={32} className="text-foreground-muted" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No entries yet</h3>
                    <p className="text-foreground-muted mb-6 max-w-sm">Start your first journal entry to track your thoughts, workouts, or fasting progress.</p>
                    <Link href="/dashboard/journal/new" className="btn-primary">
                        Create First Entry
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Search entries..."
                            className="w-full glass-panel pl-10 pr-4 py-3 bg-opacity-50 focus:bg-opacity-80 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-4">
                        {filteredEntries.map(entry => (
                            <Link key={entry.id} href={`/dashboard/journal/${entry.id}`} className="glass-panel p-5 hover:border-primary/50 transition-all group block">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{entry.title || "Untitled Entry"}</h3>
                                    <div className="text-xs text-foreground-muted flex items-center gap-1 bg-surface py-1 px-2 rounded-full">
                                        <Calendar size={12} />
                                        {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>
                                <p className="text-foreground-muted line-clamp-2 text-sm">
                                    {entry.content || "No content..."}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
