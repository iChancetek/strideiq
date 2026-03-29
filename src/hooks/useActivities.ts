"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";

export interface Activity {
    id: string;
    type: "Run" | "Walk" | "Bike" | "Hike" | "HIIT";
    distance: number; // in miles
    duration: number; // in seconds (stored) — displayed as minutes
    pace: string; // calculated: min:sec /mi
    date: Date;
    calories: number;
    notes?: string;
    mode?: "run" | "walk" | "bike" | "hike";
    environment?: "outdoor" | "indoor";
    mileSplits?: number[];            // split time in seconds for each completed mile
    pausedDuration?: number;          // total paused time in seconds
    weatherSnapshot?: {
        temp: number;                  // degrees F
        condition: string;             // e.g. "Partly Cloudy"
        humidity: number;              // percentage
        wind: number;                  // mph
    };
    path?: [number, number][];         // GPS path for map display
    steps?: number;                    // estimated step count
    media?: {
        type: "image" | "video";
        url: string;
        path: string;
        createdAt: string;
    }[];
    title?: string;
    isPublic?: boolean;
    likesCount?: number;
}

export function useActivities() {
    const [user, authLoading] = useAuthState(auth);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (authLoading) return; // Wait for auth to resolve

        if (!user) {
            setActivities([]);
            setLoading(false);
            return;
        }

        // 1. Initial Fetch
        const fetchActivities = async () => {
            try {
                const res = await fetch(`/api/activity/list?userId=${user.uid}`);
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                
                // Parse dates back to JS Date objects
                const parsed = data.activities.map((a: any) => ({
                    ...a,
                    date: new Date(a.date),
                    createdAt: new Date(a.createdAt)
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

        // 2. Setup Ably for real-time updates
        let channel: any;
        const setupAbly = async () => {
            try {
                const { ablyRealtime } = await import('@/lib/ably');
                if (!ablyRealtime) return;

                channel = ablyRealtime.channels.get(`user:${user.uid}`);
                
                await channel.subscribe('activity-created', (message: any) => {
                    const newActivity = message.data;
                    const parsedActivity = {
                        ...newActivity,
                        date: new Date(newActivity.date)
                    };
                    setActivities(prev => {
                        if (prev.some(a => a.id === parsedActivity.id)) return prev;
                        return [parsedActivity, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime());
                    });
                });

                await channel.subscribe('activity-updated', (message: any) => {
                    const updatedActivity = message.data;
                    setActivities(prev => prev.map(a => 
                        a.id === updatedActivity.id 
                            ? { ...a, ...updatedActivity, date: updatedActivity.date ? new Date(updatedActivity.date) : a.date }
                            : a
                    ));
                });

                await channel.subscribe('activity-deleted', (message: any) => {
                    const data = message.data;
                    setActivities(prev => prev.filter(a => a.id !== data.id));
                });

                console.log(`[ABLY_CONNECTED] Subscribed to user:${user.uid}`);
            } catch (err) {
                console.warn("Ably initialization failed. Falling back to polling/refresh logic.", err);
            }
        };

        setupAbly();

        return () => {
            if (channel) {
                channel.unsubscribe();
            }
        };
    }, [user, authLoading]);

    const addActivity = async (activity: Omit<Activity, "id" | "date" | "pace"> & { date: Date }) => {
        if (!user) throw new Error("User not authenticated");

        // Use the API route instead of client SDK to prevent "Network timeout" on mobile PWAs
        // The API route handles the admin-level upsert of users/{uid} safely
        const payload = {
            ...activity,
            userId: user.uid,
            date: activity.date.toISOString(),
        };

        // Standard HTTP fetch is much more resilient to mobile backgrounding than Firestore long-polling
        const response = await fetch("/api/activity/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to save activity over network.");
        }

        const data = await response.json();
        console.log("[SESSION_SAVE_SUCCESS] Activity written via API:", data.activityId);
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
