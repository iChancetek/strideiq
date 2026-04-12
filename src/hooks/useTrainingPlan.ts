"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { TrainingPlan } from "@/lib/types/training";
import { supabase } from "@/lib/supabase";

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

        // Setup Supabase Realtime Broadcast
        let channel: any = null;
        if (supabase) {
            channel = supabase.channel(`user:${user.uid}`)
                .on('broadcast', { event: 'plan-updated' }, () => {
                    fetchPlan(); // Re-fetch when plan changes
                })
                .subscribe();
        }

        return () => {
            if (channel) supabase?.removeChannel(channel);
        };
    }, [user]);

    return { plan, loading };
}

