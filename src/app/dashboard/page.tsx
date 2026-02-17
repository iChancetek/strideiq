"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import AICoach from "@/components/dashboard/AICoach";
import DailyAffirmation from "@/components/dashboard/DailyAffirmation";
import { useActivities, Activity } from "@/hooks/useActivities";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

export default function Dashboard() {
    const { activities, loading } = useActivities();
    const router = useRouter();

    // Calculate Stats
    const stats = useMemo(() => {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const recentActivities = activities.filter(a => a.date >= oneWeekAgo);

        const weeklyDistance = recentActivities.reduce((sum, a) => sum + a.distance, 0);
        const totalCalories = recentActivities.reduce((sum, a) => sum + (a.calories || 0), 0);

        // Avg Pace (weighted by distance)
        const totalDuration = recentActivities.reduce((sum, a) => sum + a.duration, 0);
        const avgPaceDecimal = weeklyDistance > 0 ? totalDuration / weeklyDistance : 0;
        const paceMin = Math.floor(avgPaceDecimal);
        const paceSec = Math.round((avgPaceDecimal - paceMin) * 60);
        const avgPace = `${paceMin}:${paceSec.toString().padStart(2, '0')}`;

        // Simple Streak Calculation (Consecutive days ending today/yesterday)
        let streak = 0;
        const distinctDays = Array.from(new Set(activities.map(a => a.date.toDateString()))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        if (distinctDays.length > 0) {
            const today = new Date().toDateString();
            const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toDateString();

            // Check if streak is active (activity today or yesterday)
            if (distinctDays[0] === today || distinctDays[0] === yesterday) {
                streak = 1;
                let currentDate = new Date(distinctDays[0]);

                for (let i = 1; i < distinctDays.length; i++) {
                    const prevDate = new Date(distinctDays[i]);
                    const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) {
                        streak++;
                        currentDate = prevDate;
                    } else {
                        break;
                    }
                }
            }
        }

        return { weeklyDistance, avgPace, totalCalories, streak };
    }, [activities]);

    return (
        <DashboardLayout>
            <header style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>Welcome back, <span className="text-gradient">Runner</span></h1>
                    <p style={{ color: "var(--foreground-muted)" }}>Here's your weekly summary.</p>
                </div>
                <button className="btn-primary" onClick={() => router.push("/dashboard/run?autostart=true")}>Start Run</button>
            </header>

            {/* Stats Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "20px",
                marginBottom: "40px"
            }}>
                <StatCard title="Weekly Distance" value={stats.weeklyDistance.toFixed(1)} unit="mi" trend="neutral" />
                <StatCard title="Avg Pace" value={stats.avgPace} unit="/mi" trend="neutral" />
                <StatCard title="Active Calories" value={Math.round(stats.totalCalories).toLocaleString()} unit="kcal" trend="neutral" />
                <StatCard title="Streak" value={stats.streak} unit="days" trend="up" trendLabel="Keep it up!" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px", marginBottom: "30px" }}>
                {/* Recent Activities List (Replaces Chart for MVP) */}
                <section className="glass-panel" style={{ padding: "30px", borderRadius: "var(--radius-lg)", minHeight: "300px" }}>
                    <h3 style={{ marginBottom: "20px" }}>Recent Activity</h3>
                    {loading ? (
                        <p style={{ color: "var(--foreground-muted)" }}>Loading...</p>
                    ) : activities.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--foreground-muted)" }}>
                            No activities yet. Go for a run!
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {activities.slice(0, 5).map(activity => (
                                <div key={activity.id} style={{
                                    padding: "15px",
                                    background: "rgba(255,255,255,0.05)",
                                    borderRadius: "var(--radius-sm)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{activity.type}</div>
                                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{activity.date.toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontWeight: 600 }}>{activity.distance} mi</div>
                                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{activity.pace} /mi</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Upcoming Training - Static for now, could be dynamic later */}
                <section className="glass-panel" style={{ padding: "30px", borderRadius: "var(--radius-lg)" }}>
                    <h3 style={{ marginBottom: "20px" }}>Up Next</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div style={{ padding: "15px", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)" }}>
                            <div style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600, marginBottom: "4px" }}>TOMORROW • 7:00 AM</div>
                            <div style={{ fontWeight: 600, fontSize: "16px" }}>Interval Speed Run</div>
                            <div style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>45 min • High Intensity</div>
                        </div>
                        <div style={{ padding: "15px", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)" }}>
                            <div style={{ fontSize: "12px", color: "var(--secondary)", fontWeight: 600, marginBottom: "4px" }}>SAT • 8:00 AM</div>
                            <div style={{ fontWeight: 600, fontSize: "16px" }}>Long Run</div>
                            <div style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>10 mi • Steady Pace</div>
                        </div>
                    </div>
                </section>
            </div>

            {/* AI Section */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
                <AICoach />
                <DailyAffirmation />
            </div>
        </DashboardLayout>
    );
}
