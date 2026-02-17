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

        // Calculate Pace (min/mi)
        const totalMinutes = activity.duration;
        const paceDecimal = activity.distance > 0 ? totalMinutes / activity.distance : 0;
        const paceMin = Math.floor(paceDecimal);
        const paceSec = Math.round((paceDecimal - paceMin) * 60);
        const pace = `${paceMin}:${paceSec.toString().padStart(2, '0')}`;

        await addDoc(collection(db, "users", user.uid, "activities"), {
            ...activity,
            pace,
            date: Timestamp.fromDate(activity.date),
            createdAt: serverTimestamp(),
        });
    };

    return { activities, loading, error, addActivity };
}
