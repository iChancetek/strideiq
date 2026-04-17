import { saveDailySteps, getDailySteps } from '@/lib/utils/idb';

export class StepAgent {
    private static instance: StepAgent;
    private isRunning = false;
    private todayDateString = "";
    private currentSteps = 0;
    private lastAcel = 0;
    private threshold = 1.2;
    private syncInterval: NodeJS.Timeout | null = null;
    
    // Callbacks for UI updates
    private listeners: Set<(steps: number) => void> = new Set();

    private constructor() {
        this.todayDateString = new Date().toISOString().split('T')[0];
    }

    static getInstance(): StepAgent {
        if (!StepAgent.instance) {
            StepAgent.instance = new StepAgent();
        }
        return StepAgent.instance;
    }

    async init(): Promise<{ needsPermission: boolean }> {
        if (this.isRunning) return { needsPermission: false };
        
        // Load initial steps for today
        this.currentSteps = await getDailySteps(this.todayDateString);
        
        // Simulate Background Steps (Interpolation since last run)
        const lastSyncTimeStr = localStorage.getItem("step_agent_last_sync_" + this.todayDateString);
        if (lastSyncTimeStr) {
            const lastSync = new Date(lastSyncTimeStr);
            const now = new Date();
            const minutesPassed = (now.getTime() - lastSync.getTime()) / 60000;
            // Only simulate if more than 30 minutes passed
            if (minutesPassed > 30) {
                 // Assume an average of 15 steps per minute of background daily life
                 const backgroundSteps = Math.floor(minutesPassed * 15);
                 this.currentSteps += Math.min(backgroundSteps, 5000); // cap to prevent absurd jumps
                 await this.syncToIDB();
            }
        }
        
        this.notifyListeners();

        if (typeof window !== "undefined") {
            const motionExt = DeviceMotionEvent as any;
            if (typeof motionExt.requestPermission === 'function') {
                // Must be requested via tap. We check if already granted, otherwise we just return needsPermission
                // Actually there's no way to check without prompting, except catching the prompt error
                return { needsPermission: true };
            } else {
                this.startTracking();
            }
        }
        
        return { needsPermission: false };
    }

    async requestPermission(): Promise<boolean> {
        if (typeof window === "undefined") return false;
        const motionExt = DeviceMotionEvent as any;
        if (typeof motionExt.requestPermission === 'function') {
            try {
                const permissionState = await motionExt.requestPermission();
                if (permissionState === 'granted') {
                    this.startTracking();
                    return true;
                }
            } catch (e) {
                console.error("Permission request failed", e);
            }
            return false;
        }
        this.startTracking();
        return true;
    }

    private startTracking() {
        if (!this.isRunning) {
            window.addEventListener('devicemotion', this.handleMotion);
            this.syncInterval = setInterval(() => this.syncToIDB(), 10000);
            setInterval(() => this.checkDayChange(), 60000);
            this.isRunning = true;
        }
    }

    private handleMotion = (event: DeviceMotionEvent) => {
        const accel = event.accelerationIncludingGravity;
        if (!accel) return;
        
        const totalAccel = Math.sqrt((accel.x || 0)**2 + (accel.y || 0)**2 + (accel.z || 0)**2);
        const delta = Math.abs(totalAccel - this.lastAcel);
        this.lastAcel = totalAccel;
        
        if (delta > this.threshold) {
            this.currentSteps += 1;
            // Throttle UI updates slightly but we just update internally fast
            this.notifyListeners();
        }
    };

    private async syncToIDB() {
        await saveDailySteps(this.todayDateString, this.currentSteps);
        if (typeof window !== "undefined") {
            localStorage.setItem("step_agent_last_sync_" + this.todayDateString, new Date().toISOString());
        }
    }

    private async checkDayChange() {
        const now = new Date();
        const dateString = now.toISOString().split('T')[0];
        
        if (dateString !== this.todayDateString) {
            // Day changed! We should sync yesterday's total to remote if auth exists, or queue it.
            // For now, we rely on the UI/app logic (like Dashboard component) to handle remote syncing of past days.
            // Let's just reset our local counters.
            
            // Final save for the old day
            await saveDailySteps(this.todayDateString, this.currentSteps);
            
            // Reset for today
            this.todayDateString = dateString;
            this.currentSteps = await getDailySteps(this.todayDateString); // could be 0, or already some steps if we restart
            this.notifyListeners();
        }
    }

    subscribe(callback: (steps: number) => void) {
        this.listeners.add(callback);
        callback(this.currentSteps); // initial burst
        return () => this.listeners.delete(callback);
    }

    private notifyListeners() {
        this.listeners.forEach(l => l(this.currentSteps));
    }
    
    getCurrentSteps() {
        return this.currentSteps;
    }
}
