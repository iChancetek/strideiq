"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import AICoach from "@/components/dashboard/AICoach";
import EliteMindset from "@/components/dashboard/EliteMindset";
import ManualActivityModal from "@/components/dashboard/ManualActivityModal";
import { useActivities, Activity } from "@/hooks/useActivities";
import { useTrainingPlan } from "@/hooks/useTrainingPlan";
import { useRouter } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";
import { authenticatedFetch } from "@/lib/api-client";

export default function Dashboard() {
    const { activities, loading } = useActivities();
    const { plan, loading: planLoading } = useTrainingPlan();
    const router = useRouter();
    const [user] = useAuthState(auth);
    const [userStats, setUserStats] = useState<any>(null);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);

    // Fetch User Stats (Badges/Records) via Authenticated API
    useEffect(() => {
        if (user) {
            const fetchStats = async () => {
                try {
                    const res = await authenticatedFetch("/api/user/stats");
                    if (res.ok) {
                        const data = await res.json();
                        setUserStats(data);
                    }
                } catch (e) {
                    console.error("Error fetching stats from Postgres:", e);
                }
            };
            fetchStats();
        }
    }, [user]);

    // Calculate Stats
    const stats = useMemo(() => {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const recentActivities = activities.filter(a => a.date >= oneWeekAgo);

        const weeklyDistance = recentActivities.reduce((sum, a) => sum + (Number(a.distance) || 0), 0);
        const totalCalories = recentActivities.reduce((sum, a) => sum + (Number(a.calories) || 0), 0);
        const weeklySteps = recentActivities.reduce((sum, a) => sum + (Number(a.steps) || 0), 0);
        
        // Avg Pace (weighted by distance)
        const totalDuration = recentActivities.reduce((sum, a) => sum + (Number(a.duration) || 0), 0);
        const avgPaceDecimal = weeklyDistance > 0 ? totalDuration / weeklyDistance : 0;
        const paceMin = Math.floor(avgPaceDecimal / 60);
        const paceSec = Math.round(avgPaceDecimal % 60);
        const avgPace = `${paceMin}:${paceSec.toString().padStart(2, '0')}`;

        // Robust Streak Calculation (Calendar Days)
        let streak = 0;
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterday = today - 86400000;

        // Get unique sorted midnight-normalized timestamps
        const activityDays = Array.from(new Set(
            activities.map(a => {
                const d = new Date(a.date);
                return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            })
        )).sort((a, b) => b - a);

        if (activityDays.length > 0) {
            const latestActivity = activityDays[0];

            // Streak is active if the latest activity is today or yesterday
            if (latestActivity === today || latestActivity === yesterday) {
                streak = 1;
                let currentDay = latestActivity;

                for (let i = 1; i < activityDays.length; i++) {
                    const prevDay = activityDays[i];
                    // If this activity were exactly one day before the current Day in our streak
                    if (currentDay - prevDay === 86400000) {
                        streak++;
                        currentDay = prevDay;
                    } else {
                        // Gap found
                        break;
                    }
                }
            }
        }

        return { weeklyDistance, avgPace, totalCalories, weeklySteps, streak };
    }, [activities]);

    return (
        <DashboardLayout>
            <header className="dash-header">
                <div>
                    <h1 style={{ fontSize: "clamp(22px, 5vw, 32px)", marginBottom: "5px" }}>Dashboard</h1>
                    <p style={{ color: "var(--foreground-muted)", fontSize: "clamp(13px, 3vw, 15px)" }}>Your daily fitness command center.</p>
                </div>
                <button className="btn-primary" onClick={() => router.push("/dashboard/run?autostart=true")}>Start Activity</button>
            </header>

            {/* Stats Grid */}
            <div className="dash-stats-grid">
                <StatCard title="Weekly Distance" value={stats.weeklyDistance.toFixed(1)} unit="mi" trend="neutral" href="/dashboard/activities" />
                <StatCard title="Weekly Steps" value={stats.weeklySteps.toLocaleString()} unit="steps" trend="neutral" href="/dashboard/activities" />
                <StatCard title="Active Calories" value={Math.round(stats.totalCalories).toLocaleString()} unit="kcal" trend="neutral" href="/dashboard/activities" />
                <StatCard title="Streak" value={stats.streak} unit="days" trend="up" trendLabel="Keep it up!" href="/dashboard/achievements" />
            </div>

            <div className="dash-main-grid">

                {/* Left Column: Coach & Mindset */}
                <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                    {/* Expanded AI Coach */}
                    <div style={{ height: "600px" }}>
                        <AICoach />
                    </div>

                    {/* Elite Daily Mindset */}
                    <EliteMindset />
                </div>

                {/* Right Column: Activity & Plan */}
                <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                    {/* Recent Activities List */}
                    <section className="glass-panel" style={{ padding: "25px", borderRadius: "var(--radius-lg)", minHeight: "300px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ margin: 0 }}>Recent Activity</h3>
                            <button 
                                onClick={() => setIsManualModalOpen(true)}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "var(--radius-full)",
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "var(--primary)",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                            >
                                + Manual Log
                            </button>
                            <button onClick={() => router.push("/dashboard/activities")} style={{ fontSize: "12px", color: "var(--primary)", background: "none", border: "none", cursor: "pointer" }}>View All</button>
                        </div>

                        {loading ? (
                            <p style={{ color: "var(--foreground-muted)" }}>Loading...</p>
                        ) : activities.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px", color: "var(--foreground-muted)" }}>
                                No activities yet. Go for a run!
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {activities.slice(0, 4).map(activity => {
                                    const isDistanceActivity = ["Run", "Walk", "Bike", "Hike"].includes(activity.type);
                                    const icon = activity.type === "Fasting" ? "⏳" : 
                                                 activity.type === "Meditation" ? "🧘" : 
                                                 activity.type === "Journal" ? "📓" : "🏃";

                                    
                                    return (
                                        <div 
                                            key={activity.id} 
                                            onClick={() => {
                                                if (isDistanceActivity) router.push(`/dashboard/activities/${activity.id}`);
                                                else if (activity.type === "Fasting") router.push("/dashboard/fasting");
                                                else if (activity.type === "Meditation") router.push("/dashboard/meditation");
                                                else if (activity.type === "Journal") router.push("/dashboard/journal");
                                            }}
                                            style={{
                                                padding: "15px",
                                                background: "rgba(255,255,255,0.03)",
                                                borderRadius: "var(--radius-sm)",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                border: "1px solid rgba(255,255,255,0.05)",
                                                cursor: "pointer",
                                                transition: "all 0.2s ease"
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                                                e.currentTarget.style.transform = "translateX(4px)";
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                                                e.currentTarget.style.transform = "translateX(0)";
                                            }}
                                        >

                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <div style={{ background: "rgba(255,255,255,0.1)", padding: "8px", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: "14px" }}>{activity.type}</div>
                                                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                                                        {activity.date instanceof Date && !isNaN(activity.date.getTime()) 
                                                            ? activity.date.toLocaleDateString() 
                                                            : "Recent"}
                                                    </div>

                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontWeight: 600, fontSize: "14px" }}>
                                                    {isDistanceActivity 
                                                        ? `${activity.distance || 0} mi` 
                                                        : activity.type === "Fasting" 
                                                            ? `${activity.goal || 16}h Goal` 
                                                            : activity.type === "Journal"
                                                                ? "Entry"
                                                                : `${Math.round((activity.duration || 0) / 60)} min`}
                                                </div>
                                                <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                                                    {isDistanceActivity 
                                                        ? `${activity.pace || "0:00"} /mi` 
                                                        : activity.type === "Fasting" 
                                                            ? "Fasting session" 
                                                            : activity.type === "Journal"
                                                                ? "Reflection"
                                                                : "Mindset recovery"}
                                                </div>

                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Upcoming Training */}
                    <section className="glass-panel" style={{ padding: "25px", borderRadius: "var(--radius-lg)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ margin: 0 }}>Up Next</h3>
                            <button onClick={() => router.push("/dashboard/training")} style={{ fontSize: "12px", color: "var(--primary)", background: "none", border: "none", cursor: "pointer" }}>Full Plan</button>
                        </div>

                        {planLoading ? (
                            <p style={{ color: "var(--foreground-muted)" }}>Loading plan...</p>
                        ) : !plan ? (
                            <div style={{ textAlign: "center", padding: "20px", color: "var(--foreground-muted)" }}>
                                <p style={{ marginBottom: "10px" }}>No active training plan.</p>
                                <button
                                    onClick={() => router.push("/dashboard/training")}
                                    style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                                >
                                    Create one now →
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {(() => {
                                    const start = new Date(plan.startDate);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);

                                    const allWorkouts = plan.weeks.flatMap((week, wIndex) =>
                                        week.workouts.map((workout, dIndex) => {
                                            const workoutDate = new Date(start);
                                            workoutDate.setDate(start.getDate() + (wIndex * 7) + dIndex);
                                            return { ...workout, date: workoutDate };
                                        })
                                    );

                                    const upcoming = allWorkouts
                                        .filter(w => w.date >= today && w.type !== "Rest")
                                        .slice(0, 2);

                                    if (upcoming.length === 0) return <p style={{ color: "var(--foreground-muted)" }}>Plan completed! 🎉</p>;

                                    return upcoming.map((workout, i) => {
                                        const isToday = workout.date.toDateString() === today.toDateString();
                                        const dateLabel = isToday ? "TODAY" : workout.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

                                        return (
                                            <div key={i} style={{
                                                padding: "15px",
                                                background: isToday ? "rgba(204, 255, 0, 0.05)" : "rgba(255,255,255,0.03)",
                                                borderRadius: "var(--radius-md)",
                                                borderLeft: `3px solid ${isToday ? "var(--primary)" : "rgba(255,255,255,0.2)"}`,
                                                border: isToday ? "1px solid rgba(204, 255, 0, 0.2)" : "1px solid rgba(255,255,255,0.05)"
                                            }}>
                                                <div style={{ fontSize: "11px", color: isToday ? "var(--primary)" : "var(--foreground-muted)", fontWeight: 700, marginBottom: "4px", letterSpacing: "1px" }}>
                                                    {dateLabel}
                                                </div>
                                                <div style={{ fontWeight: 600, fontSize: "15px", marginBottom: "2px" }}>{workout.distance || workout.type}</div>
                                                <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                                                    {workout.description}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            <style jsx>{`
                .dash-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .dash-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .dash-main-grid {
                    display: grid;
                    grid-template-columns: 1fr 2fr;
                    gap: 25px;
                    align-items: start;
                }
                @media (max-width: 768px) {
                    .dash-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .dash-header .btn-primary {
                        width: 100%;
                        text-align: center;
                    }
                    .dash-stats-grid {
                        grid-template-columns: 1fr 1fr;
                        gap: 12px;
                    }
                    .dash-main-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
            <ManualActivityModal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} />
        </DashboardLayout>
    );
}
