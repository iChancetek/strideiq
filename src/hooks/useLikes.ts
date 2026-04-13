"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

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
        if (!activityOwnerId || !activityId || !user) {
            setLoading(false);
            return;
        }

        const fetchLikes = async () => {
             try {
                const token = await user.getIdToken();
                const res = await fetch(`/api/activity/likes?activityId=${activityId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
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
    }, [activityOwnerId, activityId, user]);

    const toggleLike = async (emoji: string = "👍") => {
        if (!user) return;

        try {
            const token = await user.getIdToken();
            const response = await fetch("/api/activity/like", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    activityId,
                    userId: user.uid,
                    activityOwnerId,
                    emoji
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to toggle like");
            }
            
            // Re-fetch to update UI after like/unlike
            const res = await fetch(`/api/activity/likes?activityId=${activityId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLikes(data.likes || []);
            }
        } catch (err) {
            console.error("Error toggling like:", err);
        }
    };

    return { likes, likeCount, isLiked, loading, toggleLike };
}

