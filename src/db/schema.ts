import { pgTable, text, timestamp, doublePrecision, integer, boolean, jsonb, uuid, primaryKey, index } from "drizzle-orm/pg-core";
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
}, (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
}));

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
    aiAnalysis: jsonb("ai_analysis").$type<{
        feedback: string;
        score: number;
        insights: string[];
        model: string;
        analyzedAt: string;
    }>(),
    fastingSessionId: text("fasting_session_id"), // Refers to fasting_sessions.id if this is a fasting activity
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
    userIdIdx: index("activities_user_id_idx").on(table.userId),
    dateIdx: index("activities_date_idx").on(table.date),
    userDateIdx: index("activities_user_date_idx").on(table.userId, table.date),
}));

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
}, (table) => ({
    userIdIdx: index("journals_user_id_idx").on(table.userId),
    dateIdx: index("journals_date_idx").on(table.date),
}));

// --- FASTING ---
export const fastingSessions = pgTable("fasting_sessions", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"),
    duration: integer("duration"), // in seconds
    goal: integer("goal"), // in hours
    status: text("status"), // 'active', 'completed'
    notes: text("notes"),
    media: jsonb("media").$type<{
        type: "image" | "video";
        url: string;
        path: string;
        createdAt: string;
    }[]>(),
    aiAnalysis: jsonb("ai_analysis").$type<{
        feedback: string;
        score: number;
        insights: string[];
        model: string;
        analyzedAt: string;
    }>(),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
    userIdIdx: index("fasting_user_id_idx").on(table.userId),
    statusIdx: index("fasting_status_idx").on(table.status),
}));

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

// --- USER SETTINGS ---
export const userSettings = pgTable("user_settings", {
    userId: text("user_id").primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    theme: text("theme").default("dark"),
    units: text("units").default("imperial"),
    activityMode: text("activity_mode").default("run"),
    environment: text("environment").default("outdoor"),
    voiceCoaching: boolean("voice_coaching").default(true),
    weatherAnnouncements: boolean("weather_announcements").default(true),
    autoPause: boolean("auto_pause").default(true),
    autoPauseSensitivity: text("auto_pause_sensitivity").default("medium"),
    showMap: boolean("show_map").default(true),
    language: text("language").default("en"),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// --- USER STATS (All Time) ---
export const userStats = pgTable("user_stats", {
    userId: text("user_id").primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    totalDistance: doublePrecision("total_distance").default(0),
    totalCalories: integer("total_calories").default(0),
    totalRuns: integer("total_runs").default(0),
    totalTime: integer("total_time").default(0), // Total active time in seconds
    maxStreak: integer("max_streak").default(0),
    bestMilePace: doublePrecision("best_mile_pace"),
    longestRun: doublePrecision("longest_run").default(0),
    lastUpdated: timestamp("last_updated").defaultNow(),
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

