// StrideIQ Agentic AI — Movement Intelligence Agent
// Detects stop/start movement using a sliding window to prevent false pauses.
// Analyzes GPS speed to determine if user is truly stopped vs slow hills / traffic lights.

import { GeoPosition, AgentEvent, ModeConfig, AutoPauseSensitivity } from "./types";
import { getStopWindowSize } from "./mode-agent";

export class MovementAgent {
    private speedBuffer: number[] = [];
    private windowSize: number;
    private speedThresholdMph: number;
    private isPaused = false;
    private pauseStartTime: number | null = null;
    private totalPausedMs = 0;

    constructor(config: ModeConfig, sensitivity: AutoPauseSensitivity) {
        this.windowSize = getStopWindowSize(sensitivity);
        this.speedThresholdMph = config.speedThresholdMph;
    }

    /**
     * Feed a new GPS position. Returns an agent event if pause/resume state changed.
     */
    processPosition(pos: GeoPosition): AgentEvent | null {
        // Convert speed from m/s to mph; fallback to 0 if null
        const speedMph = pos.speed != null ? pos.speed * 2.23694 : 0;
        this.speedBuffer.push(speedMph);

        // Keep sliding window trimmed
        if (this.speedBuffer.length > this.windowSize) {
            this.speedBuffer.shift();
        }

        // Need a full window before making decisions
        if (this.speedBuffer.length < this.windowSize) {
            return null;
        }

        const avgSpeed = this.speedBuffer.reduce((a, b) => a + b, 0) / this.speedBuffer.length;

        if (!this.isPaused && avgSpeed < this.speedThresholdMph) {
            // User has stopped
            this.isPaused = true;
            this.pauseStartTime = Date.now();
            return {
                type: "session:pause",
                message: "Your session has been paused.",
                timestamp: Date.now(),
            };
        }

        if (this.isPaused && avgSpeed >= this.speedThresholdMph) {
            // User resumed
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
        this.speedBuffer = [];
        this.isPaused = false;
        this.pauseStartTime = null;
        this.totalPausedMs = 0;
    }
}
