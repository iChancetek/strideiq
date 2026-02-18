import { z } from "zod";

export const createActivitySchema = z.object({
    type: z.enum(["Run", "Walk", "Treadmill", "HIIT"]),
    distance: z.number().min(0),
    duration: z.number().min(0), // in seconds
    elevation: z.number().optional().default(0),
    calories: z.number().optional().default(0),
    steps: z.number().optional().default(0),
    notes: z.string().optional(),
    date: z.string().datetime(), // ISO string
    shoeId: z.string().optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
