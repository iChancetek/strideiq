"use client";

import { useActivitiesContext, Activity } from "@/context/ActivitiesContext";

export type { Activity };

export function useActivities() {
    return useActivitiesContext();
}
