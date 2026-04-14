"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { t } from "@/lib/translations";
import { formatDuration } from "@/lib/utils";

interface DeletedItem {
    id: string;
    type: string;
    distance?: number;
    duration?: number;
    content?: string;
    title?: string;
    deletedAt: string;
    daysLeft: number;
    notes?: string;
    date?: any;
}

export default function TrashPage() {
    const { user } = useAuth();
    const { settings } = useSettings();
    const lang = settings.language;
    const [items, setItems] = useState<DeletedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionId, setActionId] = useState<string | null>(null);

    const fetchDeletedItems = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/entry/deleted/list", {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch deleted items");
            const data = await res.json();
            setItems(data.deletedItems);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeletedItems();
    }, [user]);

    const handleRestore = async (entryId: string) => {
        if (!user || actionId) return;
        setActionId(entryId);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/entry/restore", {
                method: "POST",
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ entryId })
            });
            if (!res.ok) throw new Error("Restore failed");
            setItems(prev => prev.filter(i => i.id !== entryId));
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionId(null);
        }
    };

    const handlePurge = async (entryId: string) => {
        if (!user || actionId) return;
        if (!confirm("Are you sure? This action is permanent and cannot be undone.")) return;
        
        setActionId(entryId);
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/entry/purge", {
                method: "DELETE",
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ entryId })
            });
            if (!res.ok) throw new Error("Purge failed");
            setItems(prev => prev.filter(i => i.id !== entryId));
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionId(null);
        }
    };

    const getTypeIcon = (type: string) => {
        const t = (type || "").toLowerCase();
        if (t === "run") return "🏃";
        if (t === "walk") return "🚶";
        if (t === "bike") return "🚴";
        if (t === "hike") return "🥾";
        if (t.includes("journal") || t === "reflection") return "📓";
        if (t === "fasting") return "⏳";
        if (t === "meditation") return "🧘";
        return "📄";
    };

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
                <header style={{ marginBottom: "30px" }}>
                    <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "8px" }}>{t(lang, "trash")}</h1>
                    <p style={{ color: "var(--foreground-muted)" }}>{t(lang, "recentlyDeleted")} — {t(lang, "recoveryWindow")}</p>
                </header>

                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--foreground-muted)" }}>{t(lang, "loading")}</div>
                ) : items.length === 0 ? (
                    <div className="glass-panel" style={{ padding: "60px", textAlign: "center", borderRadius: "var(--radius-lg)" }}>
                        <div style={{ fontSize: "48px", marginBottom: "20px" }}>🗑️</div>
                        <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>{t(lang, "trashEmpty")}</h2>
                        <p style={{ color: "var(--foreground-muted)" }}>Items you delete will appear here for 30 days.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {items.map(item => (
                            <div key={item.id} className="glass-panel" style={{ 
                                padding: "20px", 
                                borderRadius: "var(--radius-md)", 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "20px",
                                border: "1px solid rgba(255,255,255,0.05)"
                            }}>
                                <div style={{ fontSize: "32px", background: "rgba(255,255,255,0.03)", width: "60px", height: "60px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {getTypeIcon(item.type)}
                                </div>
                                
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>
                                        {item.title || item.notes || `${item.type} session`}
                                    </h3>
                                    <div style={{ fontSize: "13px", color: "var(--foreground-muted)", display: "flex", gap: "12px" }}>
                                        <span>{new Date(item.deletedAt).toLocaleDateString()}</span>
                                        <span style={{ color: item.daysLeft < 7 ? "var(--error)" : "var(--primary)" }}>
                                            ⚠️ {item.daysLeft} {t(lang, "daysRemaining")}
                                        </span>
                                    </div>
                                    {item.distance !== undefined && (
                                        <div style={{ fontSize: "13px", marginTop: "4px" }}>
                                            {item.distance.toFixed(2)} mi • {formatDuration(item.duration || 0)}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button 
                                        onClick={() => handleRestore(item.id)}
                                        disabled={!!actionId}
                                        className="btn-primary" 
                                        style={{ 
                                            padding: "8px 16px", 
                                            borderRadius: "var(--radius-full)", 
                                            fontSize: "13px",
                                            background: "rgba(204, 255, 0, 0.1)",
                                            color: "var(--primary)",
                                            border: "1px solid var(--primary)",
                                            fontWeight: 700
                                        }}
                                    >
                                        {actionId === item.id ? "..." : t(lang, "restore")}
                                    </button>
                                    <button 
                                        onClick={() => handlePurge(item.id)}
                                        disabled={!!actionId}
                                        style={{ 
                                            padding: "8px 16px", 
                                            borderRadius: "var(--radius-full)", 
                                            fontSize: "13px",
                                            background: "rgba(255, 50, 50, 0.1)",
                                            color: "var(--error)",
                                            border: "1px solid var(--error)",
                                            fontWeight: 700,
                                            cursor: "pointer"
                                        }}
                                    >
                                        {actionId === item.id ? "..." : "Purge"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
