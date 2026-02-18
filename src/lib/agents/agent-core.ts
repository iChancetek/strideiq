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

export class AgentCore {
    private movementAgent: MovementAgent;
    private coachingAgent: CoachingAgent;
    private environmentAgent = new EnvironmentAgent();
    private mediaAgent = new MediaAgent();
    private voiceService: VoiceService;

    private listeners: AgentEventListener[] = [];
    private mileSplits: MileSplit[] = [];
    private lastMileCompleted = 0;
    private mileStartTime = 0;
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
        this.mileStartTime = Date.now();
        this.totalDistanceMiles = 0;
        this.mileSplits = [];
        this.lastMileCompleted = 0;
        this.weatherAnnounced = false;

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
            const splitSeconds = (now - this.mileStartTime) / 1000;
            const totalElapsed = (now - this.sessionStartTime) / 1000;

            const split: MileSplit = {
                mile: currentMile,
                splitSeconds,
                totalElapsedSeconds: totalElapsed,
            };
            this.mileSplits.push(split);
            this.mileStartTime = now;
            this.lastMileCompleted = currentMile;

            const coachEvents = this.coachingAgent.onMileCompleted(
                this.mileSplits,
                totalElapsed,
                currentDistanceMiles
            );
            coachEvents.forEach((e) => this.emit(e));
        }
    }

    /** Get the Movement Agent's current pause state */
    getIsPaused(): boolean {
        return this.autoPauseEnabled ? this.movementAgent.getIsPaused() : false;
    }

    /** Get total paused seconds */
    getPausedSeconds(): number {
        return this.autoPauseEnabled ? this.movementAgent.getTotalPausedSeconds() : 0;
    }

    /** Get collected mile splits */
    getMileSplits(): MileSplit[] {
        return [...this.mileSplits];
    }

    /** Get fetched weather data */
    getWeather(): WeatherData | null {
        return this.weather;
    }

    /** Get media agent for playlist recommendations */
    getMediaAgent(): MediaAgent {
        return this.mediaAgent;
    }

    /** Clean up */
    destroy(): void {
        this.voiceService.cancel();
        this.listeners = [];
        this.movementAgent.reset();
    }
}
