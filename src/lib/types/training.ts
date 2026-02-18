export type WorkoutType = "Rest" | "Run" | "Speed" | "Long Run" | "Cross Training";

export interface Workout {
    day: string; // "Monday", "Tuesday", etc.
    type: WorkoutType;
    distance?: string; // "3 miles", "5 km"
    duration?: string; // "30 min"
    description: string; // "Easy run at conversational pace"
    completed: boolean;
}

export interface TrainingWeek {
    week: number;
    focus: string; // "Base Building", "Speed", "Taper"
    workouts: Workout[];
}

export interface TrainingPlan {
    id?: string;
    userId: string;
    goal: string; // "Finish a 5K", "Sub-4 Marathon"
    startDate: string; // ISO Date
    raceDate: string; // ISO Date
    weeks: TrainingWeek[];
    createdAt: number;
}
