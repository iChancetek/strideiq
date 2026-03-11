// StrideIQ Agentic AI — Voice Service
// Queue-based TTS using the Web Speech API. Coordinates with MediaAgent for audio ducking.
// FIX: speechSynthesis.getVoices() returns [] on first call in Chrome/Android/iOS.
//      We now lazy-load and cache voices using the voiceschanged event.

import { MediaAgent } from "./media-agent";

function slog(event: string, detail?: string) {
    console.log(`[${event}]${detail ? " " + detail : ""}`);
}

export class VoiceService {
    private queue: string[] = [];
    private isSpeaking = false;
    private enabled = true;
    private mediaAgent: MediaAgent | null = null;
    private synth: SpeechSynthesis | null = null;
    private cachedVoices: SpeechSynthesisVoice[] = [];

    constructor(mediaAgent?: MediaAgent) {
        this.mediaAgent = mediaAgent ?? null;
        if (typeof window !== "undefined" && window.speechSynthesis) {
            this.synth = window.speechSynthesis;
            this.loadVoices();
        }
    }

    /** Load voices — must wait for voiceschanged on Chrome/Android (returns [] synchronously) */
    private loadVoices(): void {
        if (!this.synth) return;
        const populate = () => {
            this.cachedVoices = this.synth!.getVoices();
        };
        populate(); // Works immediately on Safari/Firefox
        // Chrome and Android WebView fire voiceschanged async
        this.synth.addEventListener?.("voiceschanged", populate);
    }

    private pickVoice(): SpeechSynthesisVoice | null {
        // Refresh in case they loaded after construction
        if (this.cachedVoices.length === 0 && this.synth) {
            this.cachedVoices = this.synth.getVoices();
        }
        return (
            this.cachedVoices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("samantha")) ||
            this.cachedVoices.find((v) => v.lang.startsWith("en-US")) ||
            this.cachedVoices.find((v) => v.lang.startsWith("en")) ||
            this.cachedVoices[0] ||
            null
        );
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
        if (!this.enabled || !this.synth) {
            slog("VOICE_TRIGGER", `Skipped (enabled=${this.enabled}, synth=${!!this.synth}): "${text}"`);
            return;
        }
        slog("VOICE_TRIGGER", `"${text}"`);
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

        const voice = this.pickVoice();
        if (voice) {
            utterance.voice = voice;
        }
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
            slog("VOICE_PLAYBACK_START", `"${text}"`);
        };

        utterance.onend = () => {
            // Small delay between announcements
            setTimeout(() => this.processQueue(), 400);
        };

        utterance.onerror = (e) => {
            slog("VOICE_PLAYBACK_FAIL", `"${text}" error=${e.error}`);
            // Skip and continue
            setTimeout(() => this.processQueue(), 200);
        };

        try {
            this.synth.speak(utterance);
        } catch (err) {
            slog("VOICE_PLAYBACK_FAIL", `speak() threw: ${err}`);
            this.isSpeaking = false;
            this.mediaAgent?.restore();
        }
    }

    cancel(): void {
        this.queue = [];
        this.synth?.cancel();
        this.isSpeaking = false;
        this.mediaAgent?.restore();
    }
}
