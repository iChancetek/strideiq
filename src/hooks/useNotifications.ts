"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase/config";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch, limit } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

export interface Notification {
    id: string;
    userId: string;
    actorId: string;
    actorName: string;
    actorPhoto: string | null;
    type: "like" | "comment";
    activityId: string;
    activityTitle: string;
    read: boolean;
    createdAt: any;
    emoji?: string;
    content?: string;
}

export function useNotifications() {
    const [user] = useAuthState(auth);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "notifications"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Notification));
            
            setNotifications(list);
            setUnreadCount(list.filter(n => !n.read).length);
            setLoading(false);
        }, (err) => {
            console.error("Notifications Error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const markAsRead = async (notificationId: string) => {
        try {
            const ref = doc(db, "notifications", notificationId);
            await updateDoc(ref, { read: true });
        } catch (e) {
            console.error("Mark as read failed:", e);
        }
    };

    const markAllAsRead = async () => {
        if (!user || unreadCount === 0) return;
        try {
            const batch = writeBatch(db);
            notifications.filter(n => !n.read).forEach(n => {
                const ref = doc(db, "notifications", n.id);
                batch.update(ref, { read: true });
            });
            await batch.commit();
        } catch (e) {
            console.error("Mark all as read failed:", e);
        }
    };

    return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
