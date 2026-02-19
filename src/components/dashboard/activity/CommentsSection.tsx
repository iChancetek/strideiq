"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { useUserRole } from "@/hooks/useUserRole";

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

    useEffect(() => {
        const q = query(
            collection(db, "users", ownerId, "activities", activityId, "comments"),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            } as Comment));
            setComments(msgs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [activityId, ownerId]);

    const handlePost = async () => {
        if (!newComment.trim() || !user) return;
        setSubmitting(true);
        try {
            await addDoc(collection(db, "users", ownerId, "activities", activityId, "comments"), {
                text: newComment,
                userId: user.uid,
                userName: user.displayName || "Anonymous",
                userPhoto: user.photoURL,
                parentId: replyTo?.id || null,
                createdAt: serverTimestamp()
            });
            setNewComment("");
            setReplyTo(null);
        } catch (e) {
            console.error("Failed to post comment", e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm("Delete this comment?")) return;
        try {
            await deleteDoc(doc(db, "users", ownerId, "activities", activityId, "comments", commentId));
        } catch (e) {
            console.error(e);
        }
    };

    // Thread: top-level comments + their replies
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
                    {/* Avatar */}
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
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={comment.userPhoto} alt={comment.userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : comment.userName[0]}
                    </div>

                    {/* Bubble */}
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

                        {/* Meta row */}
                        <div style={{
                            display: "flex",
                            gap: "12px",
                            marginTop: "4px",
                            marginLeft: "4px",
                            alignItems: "center",
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

                {/* Replies */}
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
            {/* Comment List */}
            <div style={{ maxHeight: "350px", overflowY: "auto", marginBottom: "12px" }}>
                {topLevel.length === 0 ? (
                    <p style={{ color: "var(--foreground-muted)", fontSize: "13px", fontStyle: "italic" }}>
                        No comments yet. Be the first!
                    </p>
                ) : (
                    topLevel.map(c => renderComment(c))
                )}
            </div>

            {/* Input */}
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
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={replyTo ? `Reply to ${replyTo.name}...` : "Write a comment..."}
                            onKeyDown={(e) => e.key === "Enter" && handlePost()}
                            style={{
                                flex: 1,
                                padding: "10px 16px",
                                borderRadius: "20px",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                color: "#fff",
                                fontSize: "13px",
                                outline: "none",
                            }}
                        />
                        <button
                            onClick={handlePost}
                            disabled={submitting || !newComment.trim()}
                            style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                background: !newComment.trim() ? "rgba(255,255,255,0.05)" : "var(--primary)",
                                border: "none",
                                color: "#fff",
                                cursor: submitting || !newComment.trim() ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px",
                                flexShrink: 0,
                                opacity: submitting ? 0.5 : 1,
                            }}
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
