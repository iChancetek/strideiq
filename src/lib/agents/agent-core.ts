// StrideIQ Agentic AI — Agent Core Orchestrator
// Wires all agents together. Receives GPS updates from the tracker and dispatches events.

import {
    GeoPosition,
    AgentEvent,
    AgentEventListener,
    MileSplit,
    WeatherData,
    ActivityMode,
    Environment,
    AutoPauseSensitivity,
} from "./types";
import { getModeConfig } from "./mode-agent";
import { MovementAgent } from "./movement-agent";
import { CoachingAgent } from "./coaching-agent";
import { EnvironmentAgent } from "./environment-agent";
import { MediaAgent } from "./media-agent";
import { VoiceService } from "./voice-service";
import { PulseAgent } from "./pulse-agent";

export class AgentCore {
    private movementAgent: MovementAgent;
    private coachingAgent: CoachingAgent;
    private environmentAgent = new EnvironmentAgent();
    private mediaAgent = new MediaAgent();
    private pulseAgent = new PulseAgent();
    private voiceService: VoiceService;

    private listeners: AgentEventListener[] = [];
    private mileSplits: MileSplit[] = [];
    private lastMileCompleted = 0;
    private lastMileActiveTime = 0;
    private sessionStartTime = 0;
    private totalDistanceMiles = 0;
    private weather: WeatherData | null = null;
    private weatherAnnounced = false;

    private mode: ActivityMode;
    private environment: Environment;
    private autoPauseEnabled: boolean;
    private voiceEnabled: boolean;
    private weatherEnabled: boolean;

    constructor(opts: {
        mode: ActivityMode;
        environment: Environment;
        autoPause: boolean;
        autoPauseSensitivity: AutoPauseSensitivity;
        voiceCoaching: boolean;
        weatherAnnouncements: boolean;
        historicalBestPace?: number | null;
        historicalLongestMiles?: number;
    }) {
        const config = getModeConfig(opts.mode);
        this.mode = opts.mode;
        this.environment = opts.environment;
        this.autoPauseEnabled = opts.autoPause;
        this.voiceEnabled = opts.voiceCoaching;
        this.weatherEnabled = opts.weatherAnnouncements;

        this.movementAgent = new MovementAgent(config, opts.autoPauseSensitivity);
        this.coachingAgent = new CoachingAgent(
            config,
            opts.historicalBestPace ?? null,
            opts.historicalLongestMiles ?? 0
        );
        this.voiceService = new VoiceService(this.mediaAgent);
        this.voiceService.setEnabled(opts.voiceCoaching);
    }

    /** Subscribe to agent events */
    on(listener: AgentEventListener): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }

    private emit(event: AgentEvent): void {
        this.listeners.forEach((l) => l(event));
        // Auto-speak voice events
        if (event.message && this.voiceEnabled) {
            this.voiceService.speak(event.message);
        }
    }

    /**
     * Called once when the session starts.
     */
    async onSessionStart(lat: number, lng: number): Promise<void> {
        this.sessionStartTime = Date.now();
        this.lastMileActiveTime = 0;
        this.totalDistanceMiles = 0;
        this.lastMileCompleted = 0;
        this.weatherAnnounced = false;
        
        // Start Pulse Agent (Optical HR)
        if (this.voiceEnabled) {
            this.pulseAgent.start().catch(e => console.error("PulseAgent start failed:", e));
        }

        // Announce start
        this.emit({
            type: "coaching:encouragement",
            message: `Starting ${this.mode} session.`,
            timestamp: Date.now()
        });

        // Fetch weather for outdoor sessions
        if (this.environment === "outdoor" && this.weatherEnabled) {
            const weather = await this.environmentAgent.fetchWeather(lat, lng);
            if (weather) {
                this.weather = weather;
                const event = this.environmentAgent.generateAnnouncement(weather);
                this.emit(event);
                this.weatherAnnounced = true;
            }
        }
    }

    /**
     * Resumes a session from a saved state (IndexedDB/crash recovery).
     */
    restoreSession(data: {
        startTime: number;
        lastMileCompleted: number;
        lastMileActiveTime: number;
        mileSplits: MileSplit[];
        totalPausedSeconds: number;
        weather?: WeatherData | null;
    }) {
        this.sessionStartTime = data.startTime;
        this.lastMileCompleted = data.lastMileCompleted;
        this.lastMileActiveTime = data.lastMileActiveTime;
        this.mileSplits = [...data.mileSplits];
        this.weather = data.weather || null;
        this.weatherAnnounced = !!data.weather;
        
        // Update movement agent's paused duration
        this.movementAgent.restorePausedDuration(data.totalPausedSeconds);

        console.log("[AGENT_CORE_RESTORE] Core state re-hydrated.", {
            splits: this.mileSplits.length,
            lastMile: this.lastMileCompleted
        });
    }

    /**
     * Feed a GPS position update from the tracker. Call on every position update.
     */
    onPositionUpdate(pos: GeoPosition, currentDistanceMiles: number): void {
        this.totalDistanceMiles = currentDistanceMiles;

        // Movement Agent — auto-pause/resume
        if (this.autoPauseEnabled) {
            const moveEvent = this.movementAgent.processPosition(pos);
            if (moveEvent) {
                this.emit(moveEvent);
            }
        }

        // Coaching Agent — mile completion check
        const currentMile = Math.floor(currentDistanceMiles);
        if (currentMile > this.lastMileCompleted && currentMile >= 1) {
            const now = Date.now();
            const totalPaused = this.movementAgent.getTotalPausedSeconds();
            const currentActiveTime = (now - this.sessionStartTime) / 1000 - totalPaused;
            
            const splitSeconds = currentActiveTime - this.lastMileActiveTime;
            const totalElapsed = (now - this.sessionStartTime) / 1000;

            const split: MileSplit = {
                mile: currentMile,
                splitSeconds,
                totalElapsedSeconds: totalElapsed,
            };
            this.mileSplits.push(split);
            this.lastMileActiveTime = currentActiveTime;
            this.lastMileCompleted = currentMile;

            const coachEvents = this.coachingAgent.onMileCompleted(
                this.mileSplits,
                totalElapsed,
                currentDistanceMiles,
                this.pulseAgent.getCurrentBpm()
            );
            coachEvents.forEach((e) => this.emit(e));
        }
    }

    /** Get the Movement Agent's current pause state */
    getIsPaused(): boolean {
        return this.autoPauseEnabled ? this.movementAgent.getIsPaused() : false;
    }

    /** Manual pause — callable from UI button, works even without autoPause enabled */
    manualPause(): void {
        const event = this.movementAgent.manualPause();
        this.emit(event);
    }

    /** Manual resume — callable from UI button, works even without autoPause enabled */
    manualResume(): void {
        const event = this.movementAgent.manualResume();
        this.emit(event);
    }

    /** Get total paused seconds */
    getPausedSeconds(): number {
        return this.autoPauseEnabled ? this.movementAgent.getTotalPausedSeconds() : 0;
    }

    /** Get collected mile splits */
    getMileSplits(): MileSplit[] {
        return [...this.mileSplits];
    }

    /** Last mile stats for session recovery */
    getLastMileCompleted(): number { return this.lastMileCompleted; }
    getLastMileActiveTime(): number { return this.lastMileActiveTime; }

    /** Get fetched weather data */
    getWeather(): WeatherData | null {
        return this.weather;
    }

    /** Get media agent for playlist recommendations */
    getMediaAgent(): MediaAgent {
        return this.mediaAgent;
    }

    /** Get current pulse from the pulse agent */
    getHeartRate(): number {
        return this.pulseAgent.getCurrentBpm();
    }

    /** Get current blood pressure estimation from the pulse agent */
    getBloodPressure(): { systolic: number; diastolic: number } {
        return this.pulseAgent.getCurrentBP();
    }

    /** Clean up */
    destroy(): void {
        this.voiceService.cancel();
        this.pulseAgent.stop();
        this.listeners = [];
        this.movementAgent.reset();
    }
}
