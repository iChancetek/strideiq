"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
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

        const fetchPlan = async () => {
             try {
                 const token = await user.getIdToken();
                 const res = await fetch("/api/training/plan", {
                     headers: { 'Authorization': `Bearer ${token}` }
                 });
                 if (res.ok) {
                     const data = await res.json();
                     setPlan(data.plan);
                 }
             } catch (err) {
                 console.error("Error fetching training plan:", err);
             } finally {
                 setLoading(false);
             }
        };

        fetchPlan();
    }, [user]);

    return { plan, loading };
}

