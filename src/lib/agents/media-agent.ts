// StrideIQ Agentic AI — Media Coordination Agent
// Handles audio ducking during voice prompts and BPM recommendations.

import { ActivityMode } from "./types";

const BPM_RECOMMENDATIONS: Record<ActivityMode, { min: number; max: number; label: string }> = {
    run: { min: 160, max: 180, label: "High-energy running tracks" },
    walk: { min: 100, max: 120, label: "Relaxed walking vibes" },
    bike: { min: 130, max: 150, label: "Endurance cycling beats" },
};

export class MediaAgent {
    private originalVolumes: Map<HTMLMediaElement, number> = new Map();
    private isDucked = false;

    /**
     * Duck all audio/video elements on the page (lower volume during voice prompts).
     */
    duck(): void {
        if (this.isDucked) return;
        this.isDucked = true;

        const elements = document.querySelectorAll("audio, video");
        elements.forEach((el) => {
            const media = el as HTMLMediaElement;
            this.originalVolumes.set(media, media.volume);
            media.volume = Math.max(0, media.volume * 0.2); // Drop to 20%
        });
    }

    /**
     * Restore all audio/video elements to their original volume.
     */
    restore(): void {
        if (!this.isDucked) return;
        this.isDucked = false;

        this.originalVolumes.forEach((vol, media) => {
            try {
                media.volume = vol;
            } catch {
                // Element may have been removed
            }
        });
        this.originalVolumes.clear();
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
