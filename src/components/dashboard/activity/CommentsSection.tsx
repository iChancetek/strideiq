"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useVoice } from "@/hooks/useVoice";
import SpeechControls from "../SpeechControls";
import { Send } from "lucide-react";

interface Comment {
    id: string;
    text: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    parentId?: string;
    createdAt: any;
}

interface CommentsSectionProps {
    activityId: string;
    ownerId: string;
}

export default function CommentsSection({ activityId, ownerId }: CommentsSectionProps) {
    const { user } = useAuth();
    const { isAdmin } = useUserRole();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { isRecording, isTranscribing, startRecording, stopRecording } = useVoice();

    useEffect(() => {
        if (!activityId || !user) {
            setLoading(false);
            return;
        }

        const fetchComments = async () => {
             try {
                const token = await user.getIdToken();
                const res = await fetch(`/api/activity/comment?activityId=${activityId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setComments(data.comments || []);
                }
             } catch (err) {
                 console.error("Error fetching comments:", err);
             } finally {
                 setLoading(false);
             }
        };

        fetchComments();
    }, [activityId, ownerId, user]);

    const handleTranscription = async () => {
        const text = await stopRecording();
        if (text) {
            setNewComment((prev: string) => prev + (prev ? " " : "") + text);
        }
    };

    const handlePost = async () => {
        if (!newComment.trim() || !user) return;
        setSubmitting(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch("/api/activity/comment", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    activityId,
                    userId: user.uid,
                    text: newComment,
                    parentId: replyTo?.id || null
                }),
            });

            if (!response.ok) throw new Error("Post failed");
            
            const data = await response.json();
            const myComment: Comment = {
                id: data.commentId || Math.random().toString(),
                text: newComment,
                userId: user.uid,
                userName: user.displayName || "Me",
                userPhoto: user.photoURL || undefined,
                parentId: replyTo?.id || undefined,
                createdAt: { toDate: () => new Date() }
            };
            setComments(prev => [...prev, myComment]);
            setNewComment("");
            setReplyTo(null);
        } catch (e) {
            console.error("Failed to post comment", e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm("Delete this comment?") || !user) return;
        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/activity/comment?id=${commentId}`, {
                method: "DELETE",
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setComments(prev => prev.filter(c => c.id !== commentId));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const topLevel = comments.filter(c => !c.parentId);
    const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

    if (loading) return <div style={{ padding: "16px 20px", color: "var(--foreground-muted)", fontSize: "13px" }}>Loading comments...</div>;

    const renderComment = (comment: Comment, isReply = false) => {
        const isOwner = user?.uid === comment.userId;
        const canDelete = isOwner || isAdmin;
        const replies = isReply ? [] : getReplies(comment.id);

        return (
            <div key={comment.id} style={{ marginBottom: isReply ? "8px" : "12px" }}>
                <div style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                    marginLeft: isReply ? "36px" : "0",
                }}>
                    <div style={{
                        width: isReply ? "28px" : "32px",
                        height: isReply ? "28px" : "32px",
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.1)",
                        overflow: "hidden",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: isReply ? "11px" : "13px",
                        fontWeight: 700,
                    }}>
                        {comment.userPhoto ? (
                            <img src={comment.userPhoto} alt={comment.userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : comment.userName?.[0] || 'U'}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{
                            background: "rgba(255,255,255,0.05)",
                            borderRadius: "12px",
                            padding: "8px 12px",
                            display: "inline-block",
                            maxWidth: "100%",
                        }}>
                            <span style={{ fontWeight: 600, fontSize: "13px", display: "block", marginBottom: "2px" }}>
                                {comment.userName}
                            </span>
                            <p style={{ fontSize: "13px", margin: 0, lineHeight: "1.4", wordBreak: "break-word" }}>
                                {comment.text}
                            </p>
                        </div>

                        <div style={{
                            display: "flex",
                            gap: "12px",
                            marginTop: "4px",
                            marginLeft: "4px",
                            alignItems: "center",
                            height: "18px"
                        }}>
                            <span style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>
                                {comment.createdAt?.toDate
                                    ? comment.createdAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                    : "Now"}
                            </span>
                            {!isReply && user && (
                                <button
                                    onClick={() => setReplyTo({ id: comment.id, name: comment.userName })}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "var(--foreground-muted)",
                                        cursor: "pointer",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        padding: 0,
                                    }}
                                >
                                    Reply
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    onClick={() => handleDelete(comment.id)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "var(--foreground-muted)",
                                        cursor: "pointer",
                                        fontSize: "11px",
                                        padding: 0,
                                    }}
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {replies.length > 0 && (
                    <div style={{ marginTop: "8px" }}>
                        {replies.map(r => renderComment(r, true))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ padding: "16px 20px" }}>
            <div style={{ maxHeight: "350px", overflowY: "auto", marginBottom: "12px" }}>
                {topLevel.length === 0 ? (
                    <p style={{ color: "var(--foreground-muted)", fontSize: "13px", fontStyle: "italic" }}>
                        No comments yet. Be the first!
                    </p>
                ) : (
                    topLevel.map(c => renderComment(c))
                )}
            </div>

            {user && (
                <div>
                    {replyTo && (
                        <div style={{
                            fontSize: "12px",
                            color: "var(--primary)",
                            marginBottom: "6px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                        }}>
                            Replying to {replyTo.name}
                            <button
                                onClick={() => setReplyTo(null)}
                                style={{ background: "none", border: "none", color: "var(--foreground-muted)", cursor: "pointer", fontSize: "14px", padding: 0 }}
                            >
                                ✕
                            </button>
                        </div>
                    )}
                    <div style={{ position: "relative", display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={replyTo ? `Reply to ${replyTo.name}...` : "Write a comment..."}
                            onKeyDown={(e) => e.key === "Enter" && handlePost()}
                            style={{
                                flex: 1,
                                padding: "10px 80px 10px 16px",
                                borderRadius: "20px",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                color: "#fff",
                                fontSize: "13px",
                                outline: "none",
                            }}
                        />
                        <div style={{ position: "absolute", right: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <SpeechControls 
                                onStartRecording={startRecording}
                                onStopRecording={handleTranscription}
                                isRecording={isRecording}
                                isTranscribing={isTranscribing}
                                showSpeaker={false}
                                size={16}
                            />
                            <button
                                onClick={handlePost}
                                disabled={submitting || !newComment.trim()}
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    background: !newComment.trim() ? "rgba(255,255,255,0.05)" : "var(--primary)",
                                    border: "none",
                                    color: "#fff",
                                    cursor: submitting || !newComment.trim() ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    opacity: submitting ? 0.5 : 1,
                                }}
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
