// StrideIQ Agentic AI — Mode Intelligence Agent
// Returns mode-specific parameters for Run / Walk / Bike

import { ActivityMode, ModeConfig, AutoPauseSensitivity } from "./types";

const MODE_CONFIGS: Record<ActivityMode, ModeConfig> = {
    run: {
        mode: "run",
        speedThresholdMph: 3.0,
        autoPauseSensitivity: "medium",
        displayMetric: "min/mile",
        coachingStyle: "performance",
        caloriesPerMile: 100,
    },
    walk: {
        mode: "walk",
        speedThresholdMph: 1.5,
        autoPauseSensitivity: "high",
        displayMetric: "min/mile",
        coachingStyle: "wellness",
        caloriesPerMile: 65,
    },
    bike: {
        mode: "bike",
        speedThresholdMph: 5.0,
        autoPauseSensitivity: "low",
        displayMetric: "mph",
        coachingStyle: "endurance",
        caloriesPerMile: 45,
    },
};

// Sensitivity overrides — how many consecutive "slow" readings before auto-pause triggers
const SENSITIVITY_WINDOWS: Record<AutoPauseSensitivity, number> = {
    high: 3,   // 3 readings (~3s) — triggers quickly
    medium: 5, // 5 readings (~5s)
    low: 8,    // 8 readings (~8s) — very patient
};

export function getModeConfig(mode: ActivityMode): ModeConfig {
    return MODE_CONFIGS[mode];
}

export function getStopWindowSize(sensitivity: AutoPauseSensitivity): number {
    return SENSITIVITY_WINDOWS[sensitivity];
}

export function getActivityLabel(mode: ActivityMode): string {
    switch (mode) {
        case "run": return "Run";
        case "walk": return "Walk";
        case "bike": return "Ride";
    }
}

export function getActivityType(mode: ActivityMode): "Run" | "Walk" | "Bike" {
    switch (mode) {
        case "run": return "Run";
        case "walk": return "Walk";
        case "bike": return "Bike";
    }
}
