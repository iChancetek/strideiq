"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, Trash2, Send } from "lucide-react";

interface Comment {
    id: string;
    text: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    createdAt: any;
}

interface CommentsSectionProps {
    activityId: string;
    ownerId: string; // The user who owns the activity (for path)
}

export default function CommentsSection({ activityId, ownerId }: CommentsSectionProps) {
    const { user } = useAuth();
    const { isAdmin } = useUserRole();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Real-time listener
    useEffect(() => {
        const q = query(
            collection(db, "users", ownerId, "activities", activityId, "comments"),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
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
                createdAt: serverTimestamp()
            });
            setNewComment("");
        } catch (e) {
            console.error("Failed to post comment", e);
            alert("Failed to post comment.");
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
            alert("Failed to delete comment.");
        }
    };

    if (loading) return <div className="text-foreground-muted text-sm">Loading comments...</div>;

    return (
        <div className="glass-panel p-6 rounded-lg mt-6">
            <h3 className="text-xl font-bold mb-4">Comments</h3>

            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
                {comments.length === 0 ? (
                    <p className="text-foreground-muted text-sm italic">No comments yet. Be the first!</p>
                ) : (
                    comments.map(comment => {
                        const isOwner = user?.uid === comment.userId;
                        const canDelete = isOwner || isAdmin;

                        return (
                            <div key={comment.id} className="flex gap-3 items-start group">
                                <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                                    {comment.userPhoto ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={comment.userPhoto} alt={comment.userName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                                            {comment.userName[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div className="glass-panel px-3 py-2 rounded-lg bg-white/5 inline-block">
                                            <span className="font-bold text-sm block mb-1">{comment.userName}</span>
                                            <p className="text-sm">{comment.text}</p>
                                        </div>
                                        {canDelete && (
                                            <button
                                                onClick={() => handleDelete(comment.id)}
                                                className="text-foreground-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                title="Delete Comment"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-xs text-foreground-muted ml-1 mt-1 inline-block">
                                        {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {user && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 glass-panel px-4 py-2 bg-black/20 focus:bg-black/40 outline-none rounded-full"
                        onKeyDown={(e) => e.key === 'Enter' && handlePost()}
                    />
                    <button
                        onClick={handlePost}
                        disabled={submitting || !newComment.trim()}
                        className="btn-primary rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </div>
            )}
        </div>
    );
}
