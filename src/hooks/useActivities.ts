"use client";

import { useState, useEffect } from "react";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    Timestamp
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";

export interface Activity {
    id: string;
    type: "Run" | "Walk" | "HIIT";
    distance: number; // in miles
    duration: number; // in minutes
    pace: string; // calculated: time/distance
    date: Date;
    calories: number;
    notes?: string;
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
                    date: d.date?.toDate() || new Date(), // Handle Firestore Timestamp
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

        try {
            const response = await fetch("/api/activity/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: user.uid,
                    ...activity,
                    // Ensure duration is in seconds for the API schema if needed, 
                    // Interface says duration is in minutes? 
                    // Schema: duration z.number().min(0) // in seconds
                    // activity.duration comes from UI. 
                    // Let's check UI usage.
                    // UI likely passes minutes. API expects seconds? 
                    // Wait, Activity interface says "duration: number; // in minutes".
                    // Zod schema says "duration: z.number().min(0), // in seconds".
                    // I need to convert.
                    duration: activity.duration * 60,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create activity");
            }

            // Optimistic update or wait for snapshot?
            // Snapshot listener will pick up the new doc added by server.
        } catch (err) {
            console.error("Failed to add activity:", err);
            throw err;
        }
    };


    return { activities, loading, error, addActivity };
}
