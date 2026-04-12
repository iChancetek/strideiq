"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import { supabase } from "@/lib/supabase";

export interface Activity {
    id: string;
    type: "Run" | "Walk" | "Bike" | "Hike" | "HIIT" | "Meditation" | "Fasting";
    distance: number; // in miles
    duration: number; // in seconds
    pace: string;
    date: Date;
    calories?: number;
    notes?: string;
    mode?: "run" | "walk" | "bike" | "hike" | "meditation" | "fasting";
    environment?: "outdoor" | "indoor";
    mileSplits?: number[];
    pausedDuration?: number;
    weatherSnapshot?: {
        temp: number;
        condition: string;
        humidity: number;
        wind: number;
    };
    aiAnalysis?: {
        feedback: string;
        score: number;
        insights: string[];
        model: string;
        analyzedAt: string;
    };
    fastingSessionId?: string;
    title?: string;
    isPublic?: boolean;
    path?: [number, number][];
    steps?: number;
    media?: {
        type: "image" | "video";
        url: string;
        path: string;
        createdAt: string;
    }[];
    likesCount?: number;
}

export function useActivities() {
    const [user, authLoading] = useAuthState(auth);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setActivities([]);
            setLoading(false);
            return;
        }

        const fetchActivities = async () => {
            try {
                // Initial immediate load: check local storage cache first
                const cached = typeof window !== 'undefined' ? localStorage.getItem(`activities_${user.uid}`) : null;
                if (cached) {
                    setActivities(JSON.parse(cached).map((a: any) => ({ 
                        ...a, 
                        date: new Date(a.date) 
                    })));
                    setLoading(false);
                }

                const res = await fetch(`/api/activity/list?userId=${user.uid}&limit=30`);
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                
                const parsed = data.activities.map((a: any) => ({
                    ...a,
                    date: new Date(a.date)
                }));
                
                setActivities(parsed);
                if (typeof window !== 'undefined') {
                    localStorage.setItem(`activities_${user.uid}`, JSON.stringify(data.activities));
                }
                setLoading(false);
            } catch (err) {
                console.error("Error fetching activities:", err);
                setError("Failed to load activities.");
                setLoading(false);
            }
        };

        fetchActivities();

        // 4. Enable Supabase Realtime (postgres_changes)
        const channel = supabase.channel(`activities_changes_${user.uid}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'activities',
                filter: `user_id=eq.${user.uid}`
            }, (payload) => {
                console.log("[ACTIVITIES_REALTIME] Change detected:", payload);
                if (payload.eventType === 'INSERT') {
                    const newActivity = payload.new as any;
                    setActivities(prev => {
                        if (prev.some(a => a.id === newActivity.id)) return prev;
                        return [{ ...newActivity, date: new Date(newActivity.date) }, ...prev];
                    });
                } else if (payload.eventType === 'UPDATE') {
                    const updated = payload.new as any;
                    setActivities(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated, date: new Date(updated.date) } : a));
                } else if (payload.eventType === 'DELETE') {
                    const deleted = payload.old as any;
                    setActivities(prev => prev.filter(a => a.id !== deleted.id));
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user, authLoading]);

    const addActivity = async (activity: Omit<Activity, "id" | "date" | "pace"> & { date: Date }) => {
        if (!user) throw new Error("User not authenticated");

        const tempId = crypto.randomUUID();
        const optimisticActivity: Activity = {
            ...activity,
            id: tempId,
            pace: "0'00\"/mi", // Placeholder
        };

        // Optimistic UI Update
        setActivities(prev => [optimisticActivity, ...prev]);

        try {
            const payload = {
                ...activity,
                id: tempId,
                userId: user.uid,
                date: activity.date.toISOString(),
            };

            const response = await fetch("/api/activity/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Failed to save activity");
            
            const data = await response.json();
            return { activityId: data.activityId };
        } catch (err) {
            // Rollback on error
            setActivities(prev => prev.filter(a => a.id !== tempId));
            throw err;
        }
    };

    const updateActivity = async (activityId: string, updates: Partial<Activity>) => {
        if (!user) throw new Error("User not authenticated");

        const response = await fetch("/api/activity/update", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: user.uid,
                activityId,
                ...updates,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to update activity");
        }

        return response.json();
    };

    const deleteActivity = async (activityId: string) => {
        if (!user) throw new Error("User not authenticated");

        const response = await fetch("/api/activity/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: user.uid,
                activityId,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to delete activity");
        }

        return response.json();
    };

    return { activities, loading, error, addActivity, updateActivity, deleteActivity };
}
