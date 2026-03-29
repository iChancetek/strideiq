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
                 const res = await fetch(`/api/training/plan?userId=${user.uid}`);
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

        // Setup Ably
        let channel: any;
        const setupAbly = async () => {
             try {
                 const { ablyRealtime } = await import("@/lib/ably");
                 if (!ablyRealtime) return;

                 channel = ablyRealtime.channels.get(`user:${user.uid}`);
                 
                 await channel.subscribe('plan-updated', () => {
                     fetchPlan(); // Re-fetch when plan changes
                 });
             } catch (err) {
                 console.warn("Ably setup failed for training hook.", err);
             }
        };

        setupAbly();

        return () => {
            if (channel) {
                channel.unsubscribe();
            }
        };
    }, [user]);

    return { plan, loading };
}
