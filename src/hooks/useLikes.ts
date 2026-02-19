"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    query,
    serverTimestamp,
} from "firebase/firestore";

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

        const q = query(
            collection(db, "users", activityOwnerId, "activities", activityId, "likes")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                userId: doc.id,
                ...doc.data(),
            } as LikedBy));
            setLikes(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [activityOwnerId, activityId]);

    const toggleLike = async () => {
        if (!user) return;

        const likeRef = doc(
            db,
            "users",
            activityOwnerId,
            "activities",
            activityId,
            "likes",
            user.uid
        );

        if (isLiked) {
            await deleteDoc(likeRef);
        } else {
            await setDoc(likeRef, {
                userId: user.uid,
                userName: user.displayName || "Anonymous",
                userPhoto: user.photoURL || null,
                createdAt: serverTimestamp(),
            });
        }
    };

    return { likes, likeCount, isLiked, loading, toggleLike };
}
