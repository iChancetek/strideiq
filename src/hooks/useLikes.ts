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

        // Setup Ably
        let channel: any;
        const setupAbly = async () => {
             try {
                 const { ablyRealtime } = await import("@/lib/ably");
                 if (!ablyRealtime) return;

                 channel = ablyRealtime.channels.get(`activity:${activityId}`);
                 
                 await channel.subscribe('like-toggled', (message: any) => {
                     const { userId, isLiked: userLiked } = message.data;
                     
                     if (userLiked) {
                         // Add like (Simplified: we might want to fetch details if it's someone else)
                         setLikes(prev => {
                             if (prev.some(l => l.userId === userId)) return prev;
                             return [...prev, { userId, userName: "User", userPhoto: undefined }];
                         });
                     } else {
                         // Remove like
                         setLikes(prev => prev.filter(l => l.userId !== userId));
                     }
                 });
             } catch (err) {
                 console.warn("Ably setup failed for likes hook.", err);
             }
        };

        setupAbly();

        return () => {
            if (channel) {
                channel.unsubscribe();
            }
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

