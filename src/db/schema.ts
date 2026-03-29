import { pgTable, text, timestamp, doublePrecision, integer, boolean, jsonb, uuid, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- USERS ---
export const users = pgTable("users", {
    id: text("id").primaryKey(), // Firebase UID
    email: text("email").notNull(),
    displayName: text("display_name"),
    photoURL: text("photo_url"),
    role: text("role").default("user"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// --- ACTIVITIES ---
export const activities = pgTable("activities", {
    id: text("id").primaryKey(), // Using text to match Firestore doc IDs or UUIDs
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: text("type").notNull(), // 'Run', 'Walk', etc.
    distance: doublePrecision("distance").notNull(),
    duration: integer("duration").notNull(), // in seconds
    calories: integer("calories").default(0),
    notes: text("notes"),
    date: timestamp("date").notNull(),
    mode: text("mode"),
    environment: text("environment"),
    mileSplits: jsonb("mile_splits").$type<number[]>(),
    pausedDuration: integer("paused_duration").default(0),
    weatherSnapshot: jsonb("weather_snapshot").$type<{
        temp: number;
        condition: string;
        humidity: number;
        wind: number;
    }>(),
    path: jsonb("path").$type<[number, number][]>(),
    steps: integer("steps").default(0),
    media: jsonb("media").$type<{
        type: "image" | "video";
        url: string;
        path: string;
        createdAt: string;
    }[]>(),
    title: text("title"),
    isPublic: boolean("is_public").default(true),
    likesCount: integer("likes_count").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// --- JOURNALS ---
export const journals = pgTable("journals", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text("title"),
    content: text("content"),
    type: text("type").default("journal"),
    date: timestamp("date").notNull().defaultNow(),
    mood: text("mood"),
    media: jsonb("media").$type<{
        type: "image" | "video";
        url: string;
        path?: string;
        createdAt?: string;
    }[]>(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// --- FASTING ---
export const fastingSessions = pgTable("fasting_sessions", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"),
    duration: integer("duration"), // in seconds
    goal: integer("goal"), // in hours
    status: text("status"), // 'active', 'completed'
    createdAt: timestamp("created_at").defaultNow(),
});

// --- FRIENDSHIPS ---
export const friendships = pgTable("friendships", {
    senderId: text("sender_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    receiverId: text("receiver_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    status: text("status").notNull(), // 'pending', 'accepted', 'blocked'
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
    pk: primaryKey({ columns: [table.senderId, table.receiverId] }),
}));

// --- LIKES ---
export const likes = pgTable("likes", {
    id: text("id").primaryKey(),
    activityId: text("activity_id").notNull().references(() => activities.id, { onDelete: 'cascade' }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp("created_at").defaultNow(),
});

// --- COMMENTS ---
export const comments = pgTable("comments", {
    id: text("id").primaryKey(),
    activityId: text("activity_id").notNull().references(() => activities.id, { onDelete: 'cascade' }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    content: text("content").notNull(),
    parentId: text("parent_id").references((): any => comments.id, { onDelete: 'cascade' }),
    createdAt: timestamp("created_at").defaultNow(),
});

// --- STATS / LEADERBOARDS ---
// In PG, we can often just query activities directly, but denormalizing for leaderboards is faster.
export const leaderboards = pgTable("leaderboards", {
    month: text("month").notNull(), // 'YYYY-MM'
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    totalMiles: doublePrecision("total_miles").default(0),
    totalSteps: integer("total_steps").default(0),
    totalRuns: integer("total_runs").default(0),
    totalTime: integer("total_time").default(0),
    avgPace: doublePrecision("avg_pace").default(0),
    lastUpdated: timestamp("last_updated").defaultNow(),
}, (table) => ({
    pk: primaryKey({ columns: [table.month, table.userId] }),
}));

// --- ACHIEVEMENTS ---
export const achievements = pgTable("achievements", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    badgeId: text("badge_id").notNull(),
    earnedAt: timestamp("earned_at").defaultNow(),
});

// --- TRAINING PLANS ---
export const trainingPlans = pgTable("training_plans", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    goal: text("goal").notNull(),
    startDate: timestamp("start_date").notNull(),
    raceDate: timestamp("race_date").notNull(),
    weeks: jsonb("weeks").$type<{
        week: number;
        focus: string;
        workouts: {
            day: string;
            type: string;
            distance?: string;
            duration?: string;
            description: string;
            completed: boolean;
        }[];
    }[]>(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// --- RELATIONSHIPS ---
export const usersRelations = relations(users, ({ many }) => ({
    activities: many(activities),
    journals: many(journals),
    fastingSessions: many(fastingSessions),
    achievements: many(achievements),
    trainingPlans: many(trainingPlans),
}));

export const activitiesRelations = relations(activities, ({ one, many }) => ({
    user: one(users, { fields: [activities.userId], references: [users.id] }),
    likes: many(likes),
    comments: many(comments),
}));

export const trainingPlansRelations = relations(trainingPlans, ({ one }) => ({
    user: one(users, { fields: [trainingPlans.userId], references: [users.id] }),
}));

