"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation"; // Correct import
import { Loader2, Wand2, Check, ArrowLeft } from "lucide-react";
import { useSettings } from "@/context/SettingsContext"; // Import settings
import { t } from "@/lib/translations"; // Import translations

interface JournalEditorProps {
    initialData?: {
        id?: string;
        title: string;
        content: string;
        mood?: string;
        tags?: string[];
        imageUrls?: string[];
    };
    isNew?: boolean;
}

export default function JournalEditor({ initialData, isNew = false }: JournalEditorProps) {
    const { user } = useAuth();
    const router = useRouter();
    const { settings } = useSettings(); // Get settings for language
    const lang = settings.language;

    const [title, setTitle] = useState(initialData?.title || "");
    const [content, setContent] = useState(initialData?.content || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imageUrls, setImageUrls] = useState<string[]>(initialData?.imageUrls || []);

    // Safety Check: Track unsaved changes
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const initialTitle = initialData?.title || "";
        const initialContent = initialData?.content || "";
        const initialImages = initialData?.imageUrls || [];

        const isTitleChanged = title !== initialTitle;
        const isContentChanged = content !== initialContent;
        const isImagesChanged = JSON.stringify(imageUrls) !== JSON.stringify(initialImages);

        setIsDirty(isTitleChanged || isContentChanged || isImagesChanged);
    }, [title, content, imageUrls, initialData]);

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
            alert(t(lang, "error")); // Localized alert
        } finally {
            setIsProcessingAI(false);
        }
    };

    const handleSaveWithImages = async () => {
        if (!title.trim() && !content.trim() && imageUrls.length === 0) return;
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
                    userId: user?.uid,
                    title,
                    content,
                    imageUrls
                })
            });

            if (res.ok) {
                setIsDirty(false); // Reset dirty state so we don't prompt on exit
                router.push("/dashboard/journal");
            } else {
                alert(t(lang, "error"));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBack = async () => {
        if (!isDirty) {
            router.back();
            return;
        }

        if (confirm(t(lang, "unsavedChanges") + " " + t(lang, "saveBeforeLeaving"))) {
            await handleSaveWithImages();
        } else {
            if (confirm(t(lang, "confirmDiscard"))) { // Localized
                router.back();
            }
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const token = await user?.getIdToken();
            const res = await fetch("/api/upload", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();
            if (data.url) {
                setImageUrls(prev => [...prev, data.url]);
            } else {
                alert(t(lang, "error"));
            }
        } catch (e) {
            console.error(e);
            alert(t(lang, "error"));
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?.id || !confirm(t(lang, "confirmDelete"))) return; // Localized

        setIsSaving(true);
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/journal/delete", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ id: initialData.id, userId: user?.uid })
            });

            if (res.ok) {
                setIsDirty(false);
                router.push("/dashboard/journal");
            } else {
                alert(t(lang, "error"));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{
            maxWidth: "768px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            minHeight: "calc(100dvh - 160px)", // Adjusted for mobile bottom nav
        }}>
            {/* Toolbar */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
            }}>
                <button
                    onClick={handleBack}
                    style={{
                        background: "none",
                        border: "none",
                        color: "var(--foreground-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        padding: "8px",
                        marginLeft: "-8px",
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div style={{ display: "flex", gap: "8px" }}>
                    {!isNew && (
                        <button
                            onClick={handleDelete}
                            disabled={isSaving}
                            style={{
                                padding: "8px 16px",
                                background: "rgba(239, 68, 68, 0.1)", // Red-500/10
                                color: "#ef4444",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "14px",
                                fontWeight: 500,
                                cursor: isSaving ? "not-allowed" : "pointer",
                            }}
                        >
                            {t(lang, "delete")}
                        </button>
                    )}
                    <button
                        onClick={handleSaveWithImages}
                        disabled={isSaving}
                        className="btn-primary" // Use global class or inline
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 16px",
                            borderRadius: "20px",
                            background: "var(--primary)",
                            color: "black",
                            border: "none",
                            fontWeight: 600,
                            fontSize: "14px",
                            cursor: isSaving ? "not-allowed" : "pointer",
                            opacity: isSaving ? 0.7 : 1,
                        }}
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                        {t(lang, "saveEntry")}
                    </button>
                </div>
            </div>

            <div className="glass-panel" style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "24px",
                overflow: "visible",
                borderRadius: "16px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                backdropFilter: "blur(10px)",
            }}>
                <input
                    type="text"
                    placeholder={t(lang, "journalTitlePlaceholder")}
                    style={{
                        background: "transparent",
                        border: "none",
                        fontSize: "24px",
                        fontWeight: 700,
                        marginBottom: "16px",
                        color: "var(--foreground)",
                        outline: "none",
                        width: "100%",
                    }}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />

                {/* AI & Media Toolbar */}
                <div style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "16px",
                    overflowX: "auto",
                    paddingBottom: "8px",
                    alignItems: "center",
                    scrollbarWidth: "none", // Firefox
                    msOverflowStyle: "none", // IE
                }}>
                    <button onClick={() => handleAI("grammar")} disabled={isProcessingAI} className="btn-secondary" style={{
                        display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", whiteSpace: "nowrap",
                        padding: "6px 12px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--foreground)", cursor: "pointer"
                    }}>
                        <Wand2 size={12} /> {t(lang, "fixGrammar")}
                    </button>
                    <button onClick={() => handleAI("expand")} disabled={isProcessingAI} style={{
                        display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", whiteSpace: "nowrap",
                        padding: "6px 12px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--foreground)", cursor: "pointer"
                    }}>
                        ✨ {t(lang, "expand")}
                    </button>
                    <button onClick={() => handleAI("concise")} disabled={isProcessingAI} style={{
                        display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", whiteSpace: "nowrap",
                        padding: "6px 12px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--foreground)", cursor: "pointer"
                    }}>
                        ✂️ {t(lang, "simplify")}
                    </button>
                    <button onClick={() => handleAI("tone", "positive")} disabled={isProcessingAI} style={{
                        display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", whiteSpace: "nowrap",
                        padding: "6px 12px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--foreground)", cursor: "pointer"
                    }}>
                        😊 {t(lang, "positive")}
                    </button>

                    <div style={{ height: "16px", width: "1px", background: "rgba(255,255,255,0.2)", margin: "0 8px" }} />

                    <label style={{
                        display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", whiteSpace: "nowrap",
                        padding: "6px 12px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--foreground)", cursor: "pointer",
                        opacity: uploading ? 0.5 : 1
                    }}>
                        {uploading ? <Loader2 size={12} className="animate-spin" /> : "📷 " + t(lang, "addImage")}
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} disabled={uploading} />
                    </label>
                </div>

                <textarea
                    style={{
                        flex: 1,
                        background: "transparent",
                        resize: "none",
                        outline: "none",
                        fontSize: "16px",
                        lineHeight: "1.6",
                        color: "var(--foreground)",
                        border: "none",
                        marginBottom: "16px",
                        width: "100%",
                        minHeight: "250px", // Ensure it doesn't collapse
                    }}
                    placeholder={t(lang, "journalContentPlaceholder")}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                />

                {/* Image Grid */}
                {imageUrls.length > 0 && (
                    <div style={{
                        display: "flex",
                        gap: "12px",
                        overflowX: "auto",
                        paddingBottom: "8px",
                    }}>
                        {imageUrls.map((url, i) => (
                            <div key={i} style={{
                                position: "relative",
                                flexShrink: 0,
                                width: "120px",
                                height: "120px",
                                borderRadius: "8px",
                                overflow: "hidden",
                                border: "1px solid rgba(255,255,255,0.1)",
                            }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt="Attachment" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                <button
                                    onClick={() => setImageUrls(prev => prev.filter((_, idx) => idx !== i))}
                                    style={{
                                        position: "absolute",
                                        top: "4px",
                                        right: "4px",
                                        background: "rgba(0,0,0,0.6)",
                                        color: "white",
                                        borderRadius: "50%",
                                        width: "20px",
                                        height: "20px",
                                        border: "none",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "12px",
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isProcessingAI && ( // Styles also inline
                <div style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(4px)",
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <div style={{
                        background: "rgba(20,20,20,0.9)",
                        padding: "16px 24px",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        color: "white",
                    }}>
                        <Loader2 className="animate-spin" color="var(--primary)" />
                        <span>{t(lang, "aiRefining")}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
