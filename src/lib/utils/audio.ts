/**
 * Play high-fidelity IQ Voice (Nova - Calm Female) via the TTS API.
 */
export async function playIQVoice(text: string, isMuted: boolean = false, language: string = "en") {
    if (isMuted || !text) {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        return;
    }

    try {
        // Clear any existing browser speech
        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        const response = await fetch("/api/ai/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, language }),
        });

        if (!response.ok) throw new Error("TTS Fetch failed");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.volume = 1.0;
        
        await audio.play();
        
        // Cleanup URL after playing
        audio.onended = () => URL.revokeObjectURL(url);
        
        return audio;
    } catch (e) {
        console.warn("IQ Voice high-fidelity playback failed, falling back to browser.", e);
        // Fallback to browser TTS if API fails
        if (typeof window !== "undefined" && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Zira"));
            if (preferredVoice) utterance.voice = preferredVoice;
            utterance.rate = 1.0;
            utterance.pitch = 1.05;
            window.speechSynthesis.speak(utterance);
        }
    }
}
