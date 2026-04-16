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

    async init() {
        if (this.isRunning) return;
        
        // Load initial steps for today
        this.currentSteps = await getDailySteps(this.todayDateString);
        this.notifyListeners();

        if (typeof window !== "undefined") {
            window.addEventListener('devicemotion', this.handleMotion);
            
            // Sync to IDB every 10 seconds
            this.syncInterval = setInterval(() => this.syncToIDB(), 10000);
            
            // Check for day change every minute
            setInterval(() => this.checkDayChange(), 60000);
        }
        this.isRunning = true;
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
