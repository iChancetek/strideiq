// StrideIQ Agentic AI — Shared Types

export type ActivityMode = "run" | "walk" | "bike" | "hike";
export type Environment = "outdoor" | "indoor";
export type AutoPauseSensitivity = "low" | "medium" | "high";

export interface GeoPosition {
    lat: number;
    lng: number;
    speed: number | null;   // m/s from GPS, null if unavailable
    accuracy: number;       // meters
    timestamp: number;      // ms epoch
}

export interface ModeConfig {
    mode: ActivityMode;
    speedThresholdMph: number;      // below this = "stopped"
    autoPauseSensitivity: AutoPauseSensitivity;
    displayMetric: "min/mile" | "mph";
    coachingStyle: "performance" | "wellness" | "endurance";
    caloriesPerMile: number;
}

export interface WeatherData {
    temp: number;          // Fahrenheit
    condition: string;     // e.g. "Partly Cloudy"
    humidity: number;      // percentage
    wind: number;          // mph
    icon: string;
}

export interface MileSplit {
    mile: number;
    splitSeconds: number;       // time for this mile
    totalElapsedSeconds: number; // wall-clock at this mile
}

export interface SessionState {
    isActive: boolean;
    isPaused: boolean;
    mode: ActivityMode;
    environment: Environment;
    distanceMiles: number;
    elapsedSeconds: number;
    pausedSeconds: number;
    currentSpeedMph: number;
    mileSplits: MileSplit[];
    positions: GeoPosition[];
    weather: WeatherData | null;
    mileAtLastAnnouncement: number;
}

// Events emitted by agents
export type AgentEventType =
    | "session:pause"
    | "session:resume"
    | "coaching:mile"
    | "coaching:pr"
    | "coaching:encouragement"
    | "weather:announcement"
    | "voice:speak"
    | "media:duck"
    | "media:restore";

export interface AgentEvent {
    type: AgentEventType;
    message?: string;       // Text for TTS
    data?: Record<string, unknown>;
    timestamp: number;
}

export type AgentEventListener = (event: AgentEvent) => void;
