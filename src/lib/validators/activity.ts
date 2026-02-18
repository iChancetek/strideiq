import { z } from "zod";

export const createActivitySchema = z.object({
    type: z.enum(["Run", "Walk", "Bike", "Treadmill", "HIIT"]),
    distance: z.number().min(0),
    duration: z.number().min(0), // in seconds
    elevation: z.number().optional().default(0),
    calories: z.number().optional().default(0),
    steps: z.number().optional().default(0),
    notes: z.string().optional(),
    date: z.string().datetime(), // ISO string
    shoeId: z.string().optional(),
    // Agentic AI fields
    mode: z.enum(["run", "walk", "bike"]).optional(),
    environment: z.enum(["outdoor", "indoor"]).optional(),
    mileSplits: z.array(z.number()).optional(),
    pausedDuration: z.number().optional(),
    weatherSnapshot: z.object({
        temp: z.number(),
        condition: z.string(),
        humidity: z.number(),
        wind: z.number(),
    }).optional(),
    media: z.array(z.object({
        type: z.enum(["image", "video"]),
        url: z.string(),
        path: z.string(),
        createdAt: z.string().datetime()
    })).optional().default([]),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
