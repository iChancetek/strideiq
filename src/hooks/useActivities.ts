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
    calories: number;
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

        // Setup Supabase Realtime Broadcast
        const channel = supabase.channel(`user:${user.uid}`)
            .on('broadcast', { event: 'activity-created' }, (message) => {
                const newActivity = message.payload;
                const parsedActivity = {
                    ...newActivity,
                    date: new Date(newActivity.date)
                };
                setActivities(prev => {
                    if (prev.some(a => a.id === parsedActivity.id)) return prev;
                    return [parsedActivity, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime());
                });
            })
            .on('broadcast', { event: 'activity-updated' }, (message) => {
                const updatedActivity = message.payload;
                setActivities(prev => prev.map(a => 
                    a.id === updatedActivity.id 
                        ? { ...a, ...updatedActivity, date: updatedActivity.date ? new Date(updatedActivity.date) : a.date }
                        : a
                ));
            })
            .on('broadcast', { event: 'activity-deleted' }, (message) => {
                const { id } = message.payload;
                setActivities(prev => prev.filter(a => a.id !== id));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, authLoading]);

    const addActivity = async (activity: Omit<Activity, "id" | "date" | "pace"> & { date: Date }) => {
        if (!user) throw new Error("User not authenticated");

        const payload = {
            ...activity,
            userId: user.uid,
            date: activity.date.toISOString(),
        };

        const response = await fetch("/api/activity/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to save activity.");
        }

        const data = await response.json();
        return { activityId: data.activityId };
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
