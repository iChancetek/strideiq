"use client";

import { useState, useEffect } from "react";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    Timestamp
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
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
    const [user] = useAuthState(auth);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user) {
            setActivities([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "users", user.uid, "activities"),
            orderBy("date", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => {
                const d = doc.data();
                return {
                    id: doc.id,
                    ...d,
                    date: d.date?.toDate() || new Date(),
                } as Activity;
            });
            setActivities(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching activities:", err);
            setError("Failed to load activities.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addActivity = async (activity: Omit<Activity, "id" | "date" | "pace"> & { date: Date }) => {
        if (!user) throw new Error("User not authenticated");

        const response = await fetch("/api/activity/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: user.uid,
                ...activity,
                // Duration is passed in seconds directly (matches Zod schema)
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create activity");
        }

        return response.json();
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
