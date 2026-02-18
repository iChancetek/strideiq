"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2, Wand2, Check, ArrowLeft } from "lucide-react";

interface JournalEditorProps {
    initialData?: {
        id?: string;
        title: string;
        content: string;
        mood?: string;
        tags?: string[];
    };
    isNew?: boolean;
}

export default function JournalEditor({ initialData, isNew = false }: JournalEditorProps) {
    const { user } = useAuth();
    const router = useRouter();

    const [title, setTitle] = useState(initialData?.title || "");
    const [content, setContent] = useState(initialData?.content || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isProcessingAI, setIsProcessingAI] = useState(false);

    const handleAI = async (command: string, tone?: string) => {
        if (!content.trim()) return;
        setIsProcessingAI(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/ai/journal-assist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ text: content, command, tone })
            });
            const data = await res.json();
            if (data.result) {
                setContent(data.result);
            }
        } catch (e) {
            console.error(e);
            alert("AI processing failed.");
        } finally {
            setIsProcessingAI(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim() && !content.trim()) return;
        setIsSaving(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/journal/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: initialData?.id, // if editing
                    title,
                    content
                })
            });

            if (res.ok) {
                router.push("/dashboard/journal");
            } else {
                alert("Failed to save entry");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?.id || !confirm("Are you sure you want to delete this entry?")) return;
        setIsSaving(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/journal/delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ id: initialData.id })
            });
            if (res.ok) {
                router.push("/dashboard/journal");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => router.back()} className="text-foreground-muted hover:text-foreground">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex gap-2">
                    {!isNew && (
                        <button
                            onClick={handleDelete}
                            disabled={isSaving}
                            className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-md text-sm font-medium transition-colors"
                        >
                            Delete
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="btn-primary flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                        Save Entry
                    </button>
                </div>
            </div>

            <div className="glass-panel flex-1 flex flex-col p-6 overflow-hidden">
                <input
                    type="text"
                    placeholder="Title your entry..."
                    className="bg-transparent text-2xl font-bold mb-4 focus:outline-none placeholder:text-foreground-muted/50"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />

                {/* AI Toolbar */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    <button onClick={() => handleAI("grammar")} disabled={isProcessingAI} className="btn-secondary text-xs flex items-center gap-1 whitespace-nowrap">
                        <Wand2 size={12} /> Fix Grammar
                    </button>
                    <button onClick={() => handleAI("expand")} disabled={isProcessingAI} className="btn-secondary text-xs flex items-center gap-1 whitespace-nowrap">
                        ✨ Expand
                    </button>
                    <button onClick={() => handleAI("concise")} disabled={isProcessingAI} className="btn-secondary text-xs flex items-center gap-1 whitespace-nowrap">
                        ✂️ Make Concise
                    </button>
                    <button onClick={() => handleAI("tone", "positive")} disabled={isProcessingAI} className="btn-secondary text-xs flex items-center gap-1 whitespace-nowrap">
                        😊 Make Positive
                    </button>
                </div>

                <textarea
                    className="flex-1 bg-transparent resize-none focus:outline-none text-lg leading-relaxed placeholder:text-foreground-muted/30"
                    placeholder="Start writing your thoughts..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                />
            </div>
            {isProcessingAI && (
                <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="glass-panel p-4 flex items-center gap-3">
                        <Loader2 className="animate-spin text-primary" />
                        <span>AI is refining your thoughts...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
