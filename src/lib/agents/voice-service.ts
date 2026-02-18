// StrideIQ Agentic AI — Voice Service
// Queue-based TTS using the Web Speech API. Coordinates with MediaAgent for audio ducking.

import { MediaAgent } from "./media-agent";

export class VoiceService {
    private queue: string[] = [];
    private isSpeaking = false;
    private enabled = true;
    private mediaAgent: MediaAgent | null = null;
    private synth: SpeechSynthesis | null = null;

    constructor(mediaAgent?: MediaAgent) {
        this.mediaAgent = mediaAgent ?? null;
        if (typeof window !== "undefined" && window.speechSynthesis) {
            this.synth = window.speechSynthesis;
        }
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (!enabled) {
            this.queue = [];
            this.synth?.cancel();
            this.isSpeaking = false;
            this.mediaAgent?.restore();
        }
    }

    /**
     * Add a message to the speech queue.
     */
    speak(text: string): void {
        if (!this.enabled || !this.synth) return;
        this.queue.push(text);
        if (!this.isSpeaking) {
            this.processQueue();
        }
    }

    private processQueue(): void {
        if (this.queue.length === 0 || !this.synth) {
            this.isSpeaking = false;
            this.mediaAgent?.restore();
            return;
        }

        this.isSpeaking = true;
        this.mediaAgent?.duck();

        const text = this.queue.shift()!;
        const utterance = new SpeechSynthesisUtterance(text);

        // Pick a good voice
        const voices = this.synth.getVoices();
        const preferred = voices.find(
            (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("samantha")
        ) || voices.find(
            (v) => v.lang.startsWith("en-US")
        ) || voices[0];

        if (preferred) {
            utterance.voice = preferred;
        }
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        utterance.onend = () => {
            // Small delay between announcements
            setTimeout(() => this.processQueue(), 400);
        };

        utterance.onerror = () => {
            // Skip and continue
            setTimeout(() => this.processQueue(), 200);
        };

        this.synth.speak(utterance);
    }

    cancel(): void {
        this.queue = [];
        this.synth?.cancel();
        this.isSpeaking = false;
        this.mediaAgent?.restore();
    }
}
