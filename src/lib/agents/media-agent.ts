// StrideIQ Agentic AI — Media Coordination Agent
// Handles audio ducking during voice prompts and BPM recommendations.

import { ActivityMode } from "./types";

const BPM_RECOMMENDATIONS: Record<ActivityMode, { min: number; max: number; label: string }> = {
    run: { min: 160, max: 180, label: "High-energy running tracks" },
    walk: { min: 100, max: 120, label: "Relaxed walking vibes" },
    bike: { min: 130, max: 150, label: "Endurance cycling beats" },
    hike: { min: 110, max: 130, label: "Scenic trail hiking tunes" },
};

export class MediaAgent {
    private pausedElements: Set<HTMLMediaElement> = new Set();
    private isDucked = false;

    /**
     * Pause all audio/video elements on the page (music should pause).
     */
    duck(): void {
        if (this.isDucked) return;
        this.isDucked = true;

        const elements = document.querySelectorAll("audio, video");
        elements.forEach((el) => {
            const media = el as HTMLMediaElement;
            if (!media.paused) {
                this.pausedElements.add(media);
                media.pause();
            }
        });
    }

    /**
     * Resume all paused audio/video elements.
     */
    restore(): void {
        if (!this.isDucked) return;
        this.isDucked = false;

        this.pausedElements.forEach((media) => {
            try {
                media.play().catch(e => console.warn("Failed to resume media:", e));
            } catch {
                // Element may have been removed
            }
        });
        this.pausedElements.clear();
    }

    /**
     * Get BPM-matched playlist recommendation for the current mode.
     */
    getPlaylistRecommendation(mode: ActivityMode): {
        bpmRange: string;
        label: string;
        spotifySearchQuery: string;
    } {
        const rec = BPM_RECOMMENDATIONS[mode];
        return {
            bpmRange: `${rec.min}-${rec.max} BPM`,
            label: rec.label,
            spotifySearchQuery: `${rec.label} ${rec.min} BPM workout`,
        };
    }
}
