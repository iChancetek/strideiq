"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { TrainingPlan } from "@/lib/types/training";

export function useTrainingPlan() {
    const { user } = useAuth();
    const [plan, setPlan] = useState<TrainingPlan | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const docRef = doc(db, "users", user.uid, "training", "current");

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setPlan(docSnap.data() as TrainingPlan);
            } else {
                setPlan(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching training plan:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { plan, loading };
}
