"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation"; // Correct import
import { Loader2, Wand2, Check, ArrowLeft, CloudOff, CloudCheck } from "lucide-react";
import { useSettings } from "@/context/SettingsContext"; // Import settings
import { t } from "@/lib/translations"; // Import translations
import { saveLocalJournal, deleteLocalJournal } from "@/lib/utils/idb";
import { authenticatedFetch } from "@/lib/api-client";
import SpeechControls from "../SpeechControls";
import { useVoice } from "@/hooks/useVoice";
import { Volume2, Mic, Share2 } from "lucide-react";
import ShareActivityModal from "../ShareActivityModal";

interface JournalEditorProps {
    initialData?: {
        id?: string;
        title: string;
        content: string;
        mood?: string;
        tags?: string[];
        imageUrls?: string[];
        media?: { url: string, type: string }[];
    };
    isNew?: boolean;
}

export default function JournalEditor({ initialData, isNew = false }: JournalEditorProps) {
    const { user } = useAuth();
    const router = useRouter();
    const { settings } = useSettings(); // Get settings for language
    const lang = settings.language;
    
    // Voice
    const { isRecording, isTranscribing, isPlaying, speak, stopSpeaking, startRecording, stopRecording } = useVoice();

    const [title, setTitle] = useState(initialData?.title || "");
    const [content, setContent] = useState(initialData?.content || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [mediaItems, setMediaItems] = useState<{ url: string, type: string }[]>(() => {
        const initial: { url: string, type: string }[] = [];
        if (Array.isArray(initialData?.imageUrls)) {
            initialData.imageUrls.forEach(url => {
                if (typeof url === "string") initial.push({ url, type: "image" });
            });
        }
        if (Array.isArray(initialData?.media)) {
            initialData.media.forEach(m => {
                if (m && typeof m === "object" && m.url) initial.push(m);
            });
        }
        return initial;
    });

    // Safety Check: Track unsaved changes
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const initialTitle = initialData?.title || "";
        const initialContent = initialData?.content || "";

        const initialLength = (initialData?.imageUrls?.length || 0) + (initialData?.media?.length || 0);

        const isTitleChanged = title !== initialTitle;
        const isContentChanged = content !== initialContent;
        const isMediaChanged = mediaItems.length !== initialLength;

        setIsDirty(isTitleChanged || isContentChanged || isMediaChanged);
    }, [title, content, mediaItems, initialData]);

    const handleTranscription = async (field: 'title' | 'content') => {
        const text = await stopRecording();
        if (text) {
            if (field === 'title') setTitle((prev: string) => prev + (prev ? " " : "") + text);
            else setContent((prev: string) => prev + (prev ? " " : "") + text);
        }
    };

    const handleTranslate = async () => {
        if (!content && !title) return;
        setIsProcessingAI(true);
        try {
            const res = await fetch("/api/ai/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    text: `Title: ${title}\n\nContent: ${content}`,
                    targetLanguage: lang 
                })
            });
            const data = await res.json();
            if (data.translated) {
                // Split back into title and content if possible, or just update content
                const parts = data.translated.split("\n\nContent: ");
                if (parts.length === 2) {
                    setTitle(parts[0].replace("Title: ", ""));
                    setContent(parts[1]);
                } else {
                    setContent(data.translated);
                }
            }
        } catch (e) {
            console.error("Translation failed", e);
        } finally {
            setIsProcessingAI(false);
        }
    };

    const handleAI = async (action: "grammar" | "expand" | "concise") => {
        if (!content) return;
        setIsProcessingAI(true);
        try {
            const promptMap = {
                grammar: "Fix any grammar and spelling mistakes in the following journal entry. Keep the original tone.",
                expand: "Expand on the following journal entry, making it more descriptive and detailed while preserving the user's intent.",
                concise: "Make the following journal entry more concise and punchy without losing key information."
            };
            
            const prompt = `${promptMap[action]}\n\n${content}`;
            
            const res = await fetch("/api/ai/chancellor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: prompt })
            });
            const data = await res.json();
            if (data.response) {
                setContent(data.response);
            }
        } catch (e) {
            console.error(`AI ${action} failed`, e);
        } finally {
            setIsProcessingAI(false);
        }
    };

    const handleSpeak = () => {
        speak(`${title}. ${content}`);
    };

    const handleSaveWithImages = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        try {
            if (!title?.trim() && !content?.trim() && mediaItems.length === 0) {
                alert("Entry is empty. Please add a title, content, or media before saving.");
                return;
            }
            if (!user) {
                alert("Authentication error. Please refresh the page and try again.");
                return;
            }

            setIsSaving(true);
            const entryId = initialData?.id || crypto.randomUUID();

            const payload: any = {
                id: entryId,
                title: title || "",
                content: content || "",
                type: "journal",
                media: mediaItems.length > 0 ? mediaItems : [],
                userId: user.uid,
                updatedAt: new Date().toISOString(),
            };

            // 1. Save Locally (Optimistic)
            await saveLocalJournal({
               ...payload,
               synced: false
            });
            console.log("[JOURNAL_OFFLINE_SAVE] Saved to IndexedDB", entryId);

            // 2. Background Sync
            try {
                const response = await authenticatedFetch("/api/journal/save", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });

                if (response.ok) {
                    await saveLocalJournal({ ...payload, synced: true });
                    console.log("[JOURNAL_SYNC_SUCCESS] Synced with Cloud Firestore", entryId);
                } else {
                    console.warn("[JOURNAL_SYNC_PENDING] Network issue, will retry later.");
                }
            } catch (syncErr) {
                console.warn("[JOURNAL_SYNC_PENDING] Offline, draft saved locally.");
            }

            setIsDirty(false);
            router.push("/dashboard/journal");
        } catch (e: any) {
            console.error("[JOURNAL_SAVE_FAILURE]", e);
            alert(`Save failed: ${e.message || "Unknown error"}. Your entry was saved locally but not synced.`);
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

    const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: "image" | "audio" | "video") => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await authenticatedFetch("/api/upload", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            if (data.url) {
                setMediaItems(prev => [...prev, { url: data.url, type }]);
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
        if (!initialData?.id || !user || !confirm(t(lang, "confirmDelete"))) return; // Localized

        setIsSaving(true);
        try {
            const response = await authenticatedFetch("/api/journal/delete", {
                method: "DELETE",
                body: JSON.stringify({ id: initialData.id })
            });

            if (response.ok) {
                await deleteLocalJournal(initialData.id);
            }

            setIsDirty(false);
            router.push("/dashboard/journal");
        } catch (e: any) {
            console.error("Delete error:", e);
            alert(`Error: ${e.message || t(lang, "error")}`);
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
                        <>
                            <button
                                onClick={() => setShowShareModal(true)}
                                style={{
                                    padding: "8px 16px",
                                    background: "rgba(255, 255, 255, 0.05)",
                                    color: "var(--foreground)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "20px",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px"
                                }}
                            >
                                <Share2 size={16} /> Share
                            </button>
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
                        </>
                    )}
                    <button
                        type="button"
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
                <div style={{ position: "relative", marginBottom: "16px" }}>
                    <input
                        type="text"
                        placeholder={t(lang, "journalTitlePlaceholder")}
                        style={{
                            background: "transparent",
                            border: "none",
                            fontSize: "24px",
                            fontWeight: 700,
                            paddingRight: "80px",
                            color: "var(--foreground)",
                            outline: "none",
                            width: "100%",
                        }}
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                    <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)" }}>
                        <SpeechControls 
                            onStartRecording={startRecording}
                            onStopRecording={() => handleTranscription('title')}
                            isRecording={isRecording}
                            isTranscribing={isTranscribing}
                            showSpeaker={false}
                            size={16}
                        />
                    </div>
                </div>

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

                    <button onClick={handleTranslate} disabled={isProcessingAI} style={{
                        display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", whiteSpace: "nowrap",
                        padding: "6px 12px", borderRadius: "16px", background: "rgba(204, 255, 0, 0.1)", border: "1px solid rgba(204, 255, 0, 0.2)", color: "var(--primary)", cursor: "pointer"
                    }}>
                        🪄 {t(lang, "translate")}
                    </button>

                    <div style={{ height: "16px", width: "1px", background: "rgba(255,255,255,0.2)", margin: "0 8px" }} />

                    <SpeechControls 
                        onSpeak={handleSpeak}
                        onStopSpeaking={stopSpeaking}
                        isPlaying={isPlaying}
                        showMic={false}
                        size={14}
                        label={isPlaying ? "Stop" : "Listen"}
                    />

                    <div style={{ height: "16px", width: "1px", background: "rgba(255,255,255,0.2)", margin: "0 8px" }} />

                    <label style={{
                        display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", whiteSpace: "nowrap",
                        padding: "6px 12px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--foreground)", cursor: "pointer",
                        opacity: uploading ? 0.5 : 1
                    }}>
                        {uploading ? <Loader2 size={12} className="animate-spin" /> : "📷 " + t(lang, "addImage")}
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleMediaUpload(e, "image")} disabled={uploading} />
                    </label>

                    <label style={{
                        display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", whiteSpace: "nowrap",
                        padding: "6px 12px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--foreground)", cursor: "pointer",
                        opacity: uploading ? 0.5 : 1
                    }}>
                        {uploading ? <Loader2 size={12} className="animate-spin" /> : "🎤 Voice"}
                        <input type="file" accept="audio/*" capture="user" style={{ display: "none" }} onChange={e => handleMediaUpload(e, "audio")} disabled={uploading} />
                    </label>

                    <label style={{
                        display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", whiteSpace: "nowrap",
                        padding: "6px 12px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--foreground)", cursor: "pointer",
                        opacity: uploading ? 0.5 : 1
                    }}>
                        {uploading ? <Loader2 size={12} className="animate-spin" /> : "📹 Video"}
                        <input type="file" accept="video/*" capture="environment" style={{ display: "none" }} onChange={e => handleMediaUpload(e, "video")} disabled={uploading} />
                    </label>
                </div>

                <div style={{ position: "relative", flex: 1 }}>
                    <textarea
                        style={{
                            width: "100%",
                            height: "100%",
                            background: "transparent",
                            resize: "none",
                            outline: "none",
                            fontSize: "16px",
                            lineHeight: "1.6",
                            color: "var(--foreground)",
                            border: "none",
                            marginBottom: "16px",
                            minHeight: "250px",
                        }}
                        placeholder={t(lang, "journalContentPlaceholder")}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                    />
                    <div style={{ position: "absolute", bottom: "16px", right: "8px" }}>
                        <SpeechControls 
                            onStartRecording={startRecording}
                            onStopRecording={() => handleTranscription('content')}
                            isRecording={isRecording}
                            isTranscribing={isTranscribing}
                            showSpeaker={false}
                            size={18}
                        />
                    </div>
                </div>

                {/* Media Grid */}
                {mediaItems.length > 0 && (
                    <div style={{
                        display: "flex",
                        gap: "12px",
                        overflowX: "auto",
                        paddingBottom: "8px",
                    }}>
                        {mediaItems.map((media, i) => (
                            <div key={i} style={{
                                position: "relative",
                                flexShrink: 0,
                                width: "160px",
                                height: "120px",
                                borderRadius: "8px",
                                overflow: "hidden",
                                border: "1px solid rgba(255,255,255,0.1)",
                                background: "rgba(0,0,0,0.5)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                                {media.type === "image" && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={media.url} alt="Attachment" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                )}
                                {media.type === "video" && (
                                    <video src={media.url} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                )}
                                {media.type === "audio" && (
                                    <audio src={media.url} controls style={{ width: "100%" }} />
                                )}
                                <button
                                    onClick={() => setMediaItems(prev => prev.filter((_, idx) => idx !== i))}
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
                        <span style={{ fontSize: "14px" }}>Enhancing entry with AI...</span>
                    </div>
                </div>
            )}

            {showShareModal && (
                <ShareActivityModal 
                    onClose={() => setShowShareModal(false)}
                    activity={{
                        type: 'journal',
                        title: title || "My Journal Entry",
                        description: content || "Reflecting on my journey...",
                        id: initialData?.id
                    }}
                />
            )}

        </div>
    );
}
