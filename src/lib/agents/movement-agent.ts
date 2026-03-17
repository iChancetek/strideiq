// StrideIQ Agentic AI — Movement Intelligence Agent
// Detects stop/start movement using a sliding window to prevent false pauses.
// Analyzes GPS speed to determine if user is truly stopped vs slow hills / traffic lights.

import { GeoPosition, AgentEvent, ModeConfig, AutoPauseSensitivity } from "./types";
import { getStopWindowSize } from "./mode-agent";

export class MovementAgent {
    private speedThresholdMph: number;
    private isPaused = false;
    private pauseStartTime: number | null = null;
    private totalPausedMs = 0;
    private manualResumeTime: number = 0;

    constructor(config: ModeConfig, sensitivity: AutoPauseSensitivity) {
        // We now ignore the sensitivity window size because the user requested instantaneous pause/resume
        this.speedThresholdMph = config.speedThresholdMph;
    }

    /**
     * Feed a new GPS position. Returns an agent event if pause/resume state changed.
     */
    processPosition(pos: GeoPosition): AgentEvent | null {
        // Convert speed from m/s to mph; fallback to 0 if null
        const speedMph = pos.speed != null ? pos.speed * 2.23694 : 0;

        // Give a 5-second grace period after a manual resume before auto-pausing again
        const gracePeriodActive = Date.now() - this.manualResumeTime < 5000;

        if (gracePeriodActive) {
            return null; // Ignore speed drops right after manual resume
        }

        // Instantaneous Auto-Pause
        if (!this.isPaused && speedMph < this.speedThresholdMph) {
            this.isPaused = true;
            this.pauseStartTime = Date.now();
            return {
                type: "session:pause",
                message: "Your session has been paused.",
                timestamp: Date.now(),
            };
        }

        // Instantaneous Auto-Resume
        if (this.isPaused && speedMph >= this.speedThresholdMph) {
            this.isPaused = false;
            if (this.pauseStartTime) {
                this.totalPausedMs += Date.now() - this.pauseStartTime;
                this.pauseStartTime = null;
            }
            return {
                type: "session:resume",
                message: "Your session has resumed. Let's go!",
                timestamp: Date.now(),
            };
        }

        return null;
    }

    /** Immediately resume from a manual UI action (no GPS needed) */
    manualResume(): AgentEvent {
        this.isPaused = false;
        this.manualResumeTime = Date.now(); // Activate grace period against instant auto-pause
        if (this.pauseStartTime) {
            this.totalPausedMs += Date.now() - this.pauseStartTime;
            this.pauseStartTime = null;
        }
        return {
            type: "session:resume",
            message: "Session resumed.",
            timestamp: Date.now(),
        };
    }

    /** Immediately pause from a manual UI action */
    manualPause(): AgentEvent {
        this.isPaused = true;
        this.pauseStartTime = Date.now();
        return {
            type: "session:pause",
            message: "Session paused.",
            timestamp: Date.now(),
        };
    }

    getIsPaused(): boolean {
        return this.isPaused;
    }

    getTotalPausedSeconds(): number {
        let total = this.totalPausedMs;
        if (this.isPaused && this.pauseStartTime) {
            total += Date.now() - this.pauseStartTime;
        }
        return Math.floor(total / 1000);
    }

    reset(): void {
        this.isPaused = false;
        this.pauseStartTime = null;
        this.totalPausedMs = 0;
    }
}
