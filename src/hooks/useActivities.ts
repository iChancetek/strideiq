"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";

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
    elevation?: number;
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
    goal?: number;
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
                const token = await user.getIdToken();
                const res = await fetch(`/api/activity/list?limit=50`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                
                const parsed = data.activities.map((a: any) => ({
                    ...a,
                    date: new Date(a.date)
                }));
                
                setActivities(parsed);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching activities:", err);
                setError("Failed to load activities.");
                setLoading(false);
            }
        };

        fetchActivities();
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

            const token = await user.getIdToken();
            const response = await fetch("/api/activity/create", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
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

        const token = await user.getIdToken();
        const response = await fetch("/api/activity/update", {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
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

        const token = await user.getIdToken();
        const response = await fetch("/api/activity/delete", {
            method: "DELETE",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
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
