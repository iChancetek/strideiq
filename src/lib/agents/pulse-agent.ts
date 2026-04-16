// StrideIQ Pulse Intelligence Agent
// Uses Photoplethysmography (PPG) to detect heart rate via mobile camera.

export interface PulseData {
    bpm: number;
    confidence: number;
    timestamp: number;
}

export class PulseAgent {
    private isRunning = false;
    private video: HTMLVideoElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private stream: MediaStream | null = null;
    
    private samples: number[] = [];
    private maxSamples = 150; // ~5 seconds at 30fps
    private lastBpm = 0;
    private lastPeakTime = 0;
    private heartbeats: number[] = [];
    
    // Filtering
    private alpha = 0.15; // Low-pass filter coefficient
    private filteredValue = 0;

    constructor() {
        if (typeof document !== "undefined") {
            this.canvas = document.createElement('canvas');
            this.canvas.width = 10;
            this.canvas.height = 10;
            this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        }
    }

    async start(): Promise<boolean> {
        if (this.isRunning) return true;
        
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            
            this.video = document.createElement('video');
            this.video.srcObject = this.stream;
            this.video.play();
            
            this.isRunning = true;
            this.lastPeakTime = Date.now();
            this.loop();
            return true;
        } catch (e) {
            console.error("[PULSE_AGENT] Camera access failed:", e);
            return false;
        }
    }

    stop() {
        this.isRunning = false;
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        if (this.video) {
            this.video.pause();
            this.video = null;
        }
        this.samples = [];
        this.heartbeats = [];
    }

    private loop = () => {
        if (!this.isRunning || !this.video || !this.ctx || !this.canvas) return;

        // Sample the average red intensity
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        let rSum = 0;
        for (let i = 0; i < data.length; i += 4) {
            rSum += data[i]; // Red channel
        }
        
        const avgR = rSum / (data.length / 4);
        
        // Simple Low-Pass Filter
        this.filteredValue = this.alpha * avgR + (1 - this.alpha) * this.filteredValue;
        
        this.processSample(this.filteredValue);
        
        requestAnimationFrame(this.loop);
    };

    private processSample(val: number) {
        this.samples.push(val);
        if (this.samples.length > this.maxSamples) this.samples.shift();

        // Peak detection (simplified)
        // A peak occurs if the value is higher than its neighbors in the window
        const windowSize = 5;
        if (this.samples.length < windowSize) return;

        const mid = Math.floor(windowSize / 2);
        const target = this.samples[this.samples.length - mid - 1];
        
        let isPeak = true;
        for (let i = 1; i <= mid; i++) {
            if (this.samples[this.samples.length - i - 1] >= target || 
                this.samples[this.samples.length - (mid * 2 + 1) + i] >= target) {
                isPeak = false;
                break;
            }
        }

        if (isPeak) {
            const now = Date.now();
            const diff = now - this.lastPeakTime;
            
            // Human heart rate range: 40 - 200 BPM
            // (1500ms down to 300ms between beats)
            if (diff > 300 && diff < 1500) {
                const bpm = 60000 / diff;
                this.heartbeats.push(bpm);
                if (this.heartbeats.length > 5) this.heartbeats.shift();
                
                // Average the last few beats for stability
                this.lastBpm = Math.round(this.heartbeats.reduce((a, b) => a + b, 0) / this.heartbeats.length);
            }
            this.lastPeakTime = now;
        }
    }

    getCurrentBpm(): number {
        return this.lastBpm;
    }

    // Estimated BP based on HR correlation and typical adult baselines
    getCurrentBP(): { systolic: number; diastolic: number } {
        if (this.lastBpm === 0) return { systolic: 0, diastolic: 0 };
        
        // Basic heuristic: BP rises with HR. 
        // Baseline: 110/70. Every 10 BPM over 60 adds roughly 5 sys and 3 dia points.
        const hrDelta = Math.max(0, this.lastBpm - 60);
        const systolic = 110 + (hrDelta * 0.5);
        const diastolic = 70 + (hrDelta * 0.3);
        
        return {
            systolic: Math.round(systolic),
            diastolic: Math.round(diastolic)
        };
    }

    getIsRunning(): boolean {
        return this.isRunning;
    }
}
