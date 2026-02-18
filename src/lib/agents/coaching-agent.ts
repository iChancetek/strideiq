// StrideIQ Agentic AI — Coaching Intelligence Agent
// Triggers at mile completions, detects PRs, generates adaptive encouragement.

import { AgentEvent, MileSplit, ModeConfig } from "./types";

// Encouragement phrase pools — varies by pace trend
const IMPROVING_PHRASES = [
    "You're getting faster — amazing work!",
    "Incredible pace improvement! Keep it up!",
    "You're on fire! That was your fastest split yet!",
    "Phenomenal effort — you're crushing it!",
    "Your speed is climbing — you are dialed in!",
];

const STEADY_PHRASES = [
    "Rock solid consistency — keep this rhythm!",
    "You are doing an excellent job — keep pushing!",
    "Great pace control! Steady wins the race.",
    "Locked in and focused. This is elite effort.",
    "Beautiful consistency — this is how champions train.",
];

const DECLINING_PHRASES = [
    "You've got this — dig deep and stay strong!",
    "Hang in there! Every step counts.",
    "Don't give up — you are tougher than you think!",
    "This is where mental strength shines. Push through!",
    "Stay with it — the finish will feel incredible!",
];

const LONG_RUN_PHRASES = [
    "This is your longest session ever — legendary!",
    "New distance record! You are rewriting your limits!",
    "Uncharted territory — and you're still going!",
];

const PR_PHRASES = [
    "New personal record! Absolutely incredible!",
    "PR alert! You just set a new best!",
    "That's a personal best — celebrate this moment!",
];

export class CoachingAgent {
    private lastPhraseIndex: Record<string, number> = {};
    private config: ModeConfig;
    private historicalBestPace: number | null; // seconds per mile
    private historicalLongestMiles: number;

    constructor(
        config: ModeConfig,
        historicalBestPace: number | null = null,
        historicalLongestMiles: number = 0
    ) {
        this.config = config;
        this.historicalBestPace = historicalBestPace;
        this.historicalLongestMiles = historicalLongestMiles;
    }

    /**
     * Called when a new mile is completed.
     * Returns coaching events (mile announcement + possible PR).
     */
    onMileCompleted(
        splits: MileSplit[],
        totalElapsedSeconds: number,
        totalDistanceMiles: number
    ): AgentEvent[] {
        const events: AgentEvent[] = [];
        const currentSplit = splits[splits.length - 1];
        const mileNumber = currentSplit.mile;
        const splitTime = this.formatDuration(currentSplit.splitSeconds);
        const totalTime = this.formatDuration(totalElapsedSeconds);

        // Determine pace trend
        const trend = this.analyzePaceTrend(splits);

        // Pick encouragement
        const encouragement = this.pickEncouragement(trend);

        // Build mile announcement
        const announcement = `Fantastic job! You completed mile ${mileNumber} in ${splitTime}. Total time is ${totalTime}. ${encouragement}`;

        events.push({
            type: "coaching:mile",
            message: announcement,
            data: {
                mile: mileNumber,
                splitSeconds: currentSplit.splitSeconds,
                totalElapsed: totalElapsedSeconds,
                trend,
            },
            timestamp: Date.now(),
        });

        // Check for PR (best pace)
        if (this.historicalBestPace && currentSplit.splitSeconds < this.historicalBestPace) {
            const prPhrase = this.pickFromPool("pr", PR_PHRASES);
            events.push({
                type: "coaching:pr",
                message: prPhrase,
                timestamp: Date.now(),
            });
        }

        // Check for longest run
        if (totalDistanceMiles > this.historicalLongestMiles && this.historicalLongestMiles > 0) {
            const longRunPhrase = this.pickFromPool("longrun", LONG_RUN_PHRASES);
            events.push({
                type: "coaching:encouragement",
                message: longRunPhrase,
                timestamp: Date.now(),
            });
        }

        return events;
    }

    private analyzePaceTrend(splits: MileSplit[]): "improving" | "steady" | "declining" {
        if (splits.length < 2) return "steady";
        const last = splits[splits.length - 1].splitSeconds;
        const prev = splits[splits.length - 2].splitSeconds;
        const delta = last - prev;
        const threshold = prev * 0.03; // 3% change threshold

        if (delta < -threshold) return "improving"; // faster = lower time
        if (delta > threshold) return "declining";
        return "steady";
    }

    private pickEncouragement(trend: "improving" | "steady" | "declining"): string {
        const pool = trend === "improving"
            ? IMPROVING_PHRASES
            : trend === "declining"
                ? DECLINING_PHRASES
                : STEADY_PHRASES;
        return this.pickFromPool(trend, pool);
    }

    private pickFromPool(key: string, pool: string[]): string {
        const lastIdx = this.lastPhraseIndex[key] ?? -1;
        let nextIdx = (lastIdx + 1) % pool.length;
        this.lastPhraseIndex[key] = nextIdx;
        return pool[nextIdx];
    }

    private formatDuration(totalSeconds: number): string {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);

        if (hours > 0) {
            return `${hours} hour${hours > 1 ? "s" : ""}, ${minutes} minute${minutes !== 1 ? "s" : ""} and ${seconds} second${seconds !== 1 ? "s" : ""}`;
        }
        return `${minutes} minute${minutes !== 1 ? "s" : ""} and ${seconds} second${seconds !== 1 ? "s" : ""}`;
    }
}
