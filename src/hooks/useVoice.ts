import { useState, useCallback, useRef } from 'react';
import { playIQVoice } from '@/lib/utils/audio';

export function useVoice() {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);

    // TTS: Speak text
    const speak = useCallback(async (text: string) => {
        if (!text) return;
        
        // Stop current playback if any
        stopSpeaking();
        
        setIsPlaying(true);
        try {
            const audio = await playIQVoice(text);
            if (audio) {
                currentAudioRef.current = audio;
                audio.onended = () => setIsPlaying(false);
                audio.onerror = () => setIsPlaying(false);
            } else {
                // playIQVoice might use window.speechSynthesis as fallback
                // which doesn't return an Audio object. We'll just assume it's playing
                // and we can't easily track local speech end without more logic.
                // But for now, let's keep it simple.
                // setIsPlaying(false);
            }
        } catch (error) {
            console.error("Speech playback error:", error);
            setIsPlaying(false);
        }
    }, []);

    const stopSpeaking = useCallback(() => {
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current.currentTime = 0;
            currentAudioRef.current = null;
        }
        if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
    }, []);

    // STT: Capture and Transcribe
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Microphone access error:", error);
            alert("Could not access microphone.");
        }
    }, []);

    const stopRecording = useCallback(async (): Promise<string | null> => {
        return new Promise((resolve) => {
            if (!mediaRecorderRef.current || !isRecording) {
                resolve(null);
                return;
            }

            mediaRecorderRef.current.onstop = async () => {
                setIsTranscribing(true);
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append("file", new File([audioBlob], "recording.webm"));

                try {
                    const response = await fetch("/api/ai/transcribe", {
                        method: "POST",
                        body: formData,
                    });
                    const data = await response.json();
                    setIsTranscribing(false);
                    resolve(data.text || null);
                } catch (error) {
                    console.error("Transcription error:", error);
                    setIsTranscribing(false);
                    resolve(null);
                }
            };

            mediaRecorderRef.current.stop();
            setIsRecording(false);
        });
    }, [isRecording]);

    return {
        isRecording,
        isTranscribing,
        isPlaying,
        speak,
        stopSpeaking,
        startRecording,
        stopRecording
    };
}
