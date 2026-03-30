"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

interface LikedBy {
    userId: string;
    userName: string;
    userPhoto?: string;
}

export function useLikes(activityOwnerId: string, activityId: string) {
    const { user } = useAuth();
    const [likes, setLikes] = useState<LikedBy[]>([]);
    const [loading, setLoading] = useState(true);

    const isLiked = user ? likes.some(l => l.userId === user.uid) : false;
    const likeCount = likes.length;

    useEffect(() => {
        if (!activityOwnerId || !activityId) return;

        const fetchLikes = async () => {
             try {
                 const res = await fetch(`/api/activity/likes?activityId=${activityId}`);
                 if (res.ok) {
                     const data = await res.json();
                     setLikes(data.likes || []);
                 }
             } catch (err) {
                 console.error("Error fetching likes:", err);
             } finally {
                 setLoading(false);
             }
        };

        fetchLikes();

        // Setup Supabase Realtime Broadcast
        const channel = supabase.channel(`activity:${activityId}`)
            .on('broadcast', { event: 'like-toggled' }, (message) => {
                const { userId, isLiked: userLiked } = message.payload;
                     
                if (userLiked) {
                    setLikes(prev => {
                        if (prev.some(l => l.userId === userId)) return prev;
                        return [...prev, { userId, userName: "User", userPhoto: undefined }];
                    });
                } else {
                    setLikes(prev => prev.filter(l => l.userId !== userId));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activityOwnerId, activityId]);

    const toggleLike = async () => {
        if (!user) return;

        try {
            const response = await fetch("/api/activity/like", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    activityId,
                    userId: user.uid,
                    activityOwnerId
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to toggle like");
            }
        } catch (err) {
            console.error("Error toggling like:", err);
        }
    };

    return { likes, likeCount, isLiked, loading, toggleLike };
}

