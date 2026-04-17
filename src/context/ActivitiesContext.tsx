"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth } from "@/lib/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";

export interface Activity {
    id: string;
    type: "Run" | "Walk" | "Bike" | "Hike" | "HIIT" | "Meditation" | "Fasting" | "Journal" | "Daily Steps" | "Weight Training" | "Yoga" | "Aerobics";
    distance: number; // in miles
    duration: number; // in seconds
    pace: string;
    date: Date;
    calories?: number;
    notes?: string;
    mode?: "run" | "walk" | "bike" | "hike" | "meditation" | "fasting" | "Journal" | "weights" | "yoga" | "aerobics";

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
    startTime?: string;
    endTime?: string;
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
    content?: string;
    bpSystolic?: number;
    bpDiastolic?: number;
}

interface ActivitiesContextValue {
    activities: Activity[];
    loading: boolean;
    error: string;
    addActivity: (activity: Omit<Activity, "id" | "date" | "pace"> & { date: Date; idempotencyKey?: string }) => Promise<{ activityId: string }>;
    updateActivity: (activityId: string, updates: Partial<Activity>) => Promise<any>;
    deleteActivity: (activityId: string) => Promise<any>;
    refreshActivities: () => Promise<void>;
}

const ActivitiesContext = createContext<ActivitiesContextValue | undefined>(undefined);

export function ActivitiesProvider({ children }: { children: React.ReactNode }) {
    const [user, authLoading] = useAuthState(auth);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchActivities = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/activity/list?limit=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            
            const parsed = data.activities.map((a: any) => {
                const toDate = (val: any) => {
                    if (!val) return undefined;
                    if (val._seconds) return new Date(val._seconds * 1000);
                    return new Date(val);
                };

                return {
                    ...a,
                    date: toDate(a.date) || new Date(),
                    startTime: toDate(a.startTime),
                    endTime: toDate(a.endTime),
                };
            });
            
            setActivities(parsed);
        } catch (err) {
            console.error("Error fetching activities:", err);
            setError("Failed to load activities.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setActivities([]);
            setLoading(false);
            return;
        }
        fetchActivities();
    }, [user, authLoading, fetchActivities]);

    const addActivity = async (activity: Omit<Activity, "id" | "date" | "pace"> & { date: Date; idempotencyKey?: string }) => {
        if (!user) throw new Error("User not authenticated");

        // Use a caller-provided idempotency key or generate one.
        // The SAME key must be reused across retries so the server can deduplicate.
        const idempotencyKey = activity.idempotencyKey || crypto.randomUUID();
        const tempId = crypto.randomUUID();
        const optimisticActivity: Activity = {
            ...activity,
            id: tempId,
            pace: "0'00\"/mi", // Placeholder
        };

        // Only add optimistic entry if we don't already have one from a prior retry
        setActivities(prev => {
            const alreadyExists = prev.some(a => (a as any).idempotencyKey === idempotencyKey);
            if (alreadyExists) return prev;
            return [{ ...optimisticActivity, idempotencyKey } as any, ...prev];
        });

        try {
            const { idempotencyKey: _dropped, ...activityWithoutKey } = activity;
            const payload = {
                ...activityWithoutKey,
                idempotencyKey,
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

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to save activity");
            }
            
            const data = await response.json();
            
            // Re-fetch to ensure exact server time/formats are matched
            fetchActivities();
            
            return { activityId: data.activityId };
        } catch (err) {
            setActivities(prev => prev.filter(a => a.id !== tempId && (a as any).idempotencyKey !== idempotencyKey));
            throw err;
        }
    };

    const updateActivity = async (activityId: string, updates: Partial<Activity>) => {
        if (!user) throw new Error("User not authenticated");

        // Optimistic update
        setActivities(prev => prev.map(a => a.id === activityId ? { ...a, ...updates } : a));

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
            // Rollback could be handled here if we cached the old state
            fetchActivities(); 
            throw new Error(errorData.error || "Failed to update activity");
        }

        return response.json();
    };

    const deleteActivity = async (activityId: string) => {
        if (!user) throw new Error("User not authenticated");

        // Optimistic delete
        setActivities(prev => prev.filter(a => a.id !== activityId));

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
            fetchActivities(); // Rollback
            throw new Error(errorData.error || "Failed to delete activity");
        }

        return response.json();
    };

    return (
        <ActivitiesContext.Provider value={{ activities, loading, error, addActivity, updateActivity, deleteActivity, refreshActivities: fetchActivities }}>
            {children}
        </ActivitiesContext.Provider>
    );
}

export const useActivitiesContext = () => {
    const context = useContext(ActivitiesContext);
    if (context === undefined) {
        throw new Error("useActivitiesContext must be used within an ActivitiesProvider");
    }
    return context;
};
