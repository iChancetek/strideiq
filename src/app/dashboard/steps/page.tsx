"use client";

import { useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useActivities } from "@/hooks/useActivities";
import Link from "next/link";

export default function StepsPage() {
    const { activities, loading } = useActivities();

    const { todaySteps, yesterdaySteps, weekAvg, lastWeekAvg, monthAvg, lastMonthAvg, yearAvg, lastYearAvg, hourBuckets, weeklyBuckets } = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
        
        let filtered = activities.filter((a) => (a.steps ?? 0) > 0);

        // Daily
        const todayActivities = filtered.filter(a => a.date >= startOfToday);
        const yesterdayActivities = filtered.filter(a => a.date >= startOfYesterday && a.date < startOfToday);
        const todaySteps = todayActivities.reduce((sum, a) => sum + (a.steps || 0), 0);
        const yesterdaySteps = yesterdayActivities.reduce((sum, a) => sum + (a.steps || 0), 0);
        
        // Hourly for today
        const hourBuckets = new Array(24).fill(0);
        todayActivities.forEach(a => {
            hourBuckets[a.date.getHours()] += (a.steps || 0);
        });

        // Weekly
        const startOfThisWeek = new Date(now.getTime() - 7 * 86400000);
        const startOfLastWeek = new Date(startOfThisWeek.getTime() - 7 * 86400000);
        const thisWeekActivities = filtered.filter(a => a.date >= startOfThisWeek);
        const lastWeekActivities = filtered.filter(a => a.date >= startOfLastWeek && a.date < startOfThisWeek);
        
        const weekTotal = thisWeekActivities.reduce((sum, a) => sum + (a.steps || 0), 0);
        const lastWeekTotal = lastWeekActivities.reduce((sum, a) => sum + (a.steps || 0), 0);
        const weekAvg = Math.round(weekTotal / 7);
        const lastWeekAvg = Math.round(lastWeekTotal / 7);

        // Weekly buckets (last 7 days individually)
        const weeklyBuckets = new Array(7).fill(0);
        thisWeekActivities.forEach(a => {
            const daysAgo = Math.floor((now.getTime() - a.date.getTime()) / 86400000);
            if (daysAgo >= 0 && daysAgo < 7) {
                 weeklyBuckets[6 - daysAgo] += (a.steps || 0);
            }
        });

        // Monthly
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const thisMonthActivities = filtered.filter(a => a.date >= startOfThisMonth);
        const lastMonthActivities = filtered.filter(a => a.date >= startOfLastMonth && a.date < startOfThisMonth);
        
        const monthTotal = thisMonthActivities.reduce((sum, a) => sum + (a.steps || 0), 0);
        const lastMonthTotal = lastMonthActivities.reduce((sum, a) => sum + (a.steps || 0), 0);
        const monthAvg = Math.round(monthTotal / now.getDate()) || 0;
        const lastMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
        const lastMonthAvg = Math.round(lastMonthTotal / lastMonthDays) || 0;

        // Yearly
        const startOfThisYear = new Date(now.getFullYear(), 0, 1);
        const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
        const thisYearActivities = filtered.filter(a => a.date >= startOfThisYear);
        const lastYearActivities = filtered.filter(a => a.date >= startOfLastYear && a.date < startOfThisYear);
        
        const yearTotal = thisYearActivities.reduce((sum, a) => sum + (a.steps || 0), 0);
        const lastYearTotal = lastYearActivities.reduce((sum, a) => sum + (a.steps || 0), 0);
        
        const dayOfYear = Math.floor((now.getTime() - startOfThisYear.getTime()) / 86400000) + 1;
        const yearAvg = Math.round(yearTotal / dayOfYear) || 0;
        const lastYearAvg = Math.round(lastYearTotal / 365) || 0;

        return { 
            todaySteps, yesterdaySteps, 
            weekAvg, lastWeekAvg, 
            monthAvg, lastMonthAvg, 
            yearAvg, lastYearAvg, 
            hourBuckets, weeklyBuckets
        };
    }, [activities]);

    const maxHourSteps = Math.max(...hourBuckets, 100);
    const maxWeekSteps = Math.max(...weeklyBuckets, weekAvg, 100);

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "640px", margin: "0 auto", paddingBottom: "40px" }}>
                <header style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Link href="/dashboard" style={{ color: "var(--primary)", textDecoration: "none", fontSize: "16px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>‹</span> All Health Data
                    </Link>
                    <h1 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>Steps</h1>
                    <button style={{ color: "var(--primary)", background: "none", border: "none", fontSize: "16px", fontWeight: "500", cursor: "pointer" }}>Add Data</button>
                </header>

                <div style={{ marginBottom: "30px" }}>
                    <h2 style={{ fontSize: "36px", fontWeight: "800", margin: "0 0 4px 0", lineHeight: "1.1" }}>
                        {todaySteps.toLocaleString()} <span style={{ fontSize: "20px", color: "var(--foreground-muted)", fontWeight: "600" }}>steps</span>
                    </h2>
                    <div style={{ fontSize: "14px", color: "var(--foreground-muted)", fontWeight: "500" }}>Today</div>
                </div>

                {/* Main Graph */}
                <div style={{ height: "200px", marginBottom: "30px", position: "relative", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "flex-end", gap: "4px" }}>
                    {/* Y-Axis lines */}
                    {[0, 0.33, 0.66, 1].map((pct, i) => (
                        <div key={i} style={{ position: "absolute", bottom: `${pct * 100}%`, left: 0, right: 0, borderBottom: "1px dashed rgba(255,255,255,0.1)", zIndex: 0 }}>
                            <span style={{ position: "absolute", right: 0, bottom: "4px", fontSize: "10px", color: "var(--foreground-muted)" }}>
                                {Math.round(maxHourSteps * pct).toLocaleString()}
                            </span>
                        </div>
                    ))}
                    
                    {/* Hourly Bars */}
                    {hourBuckets.map((steps, h) => (
                        <div key={h} style={{ flex: 1, zIndex: 1, display: "flex", justifyContent: "center", height: "100%", alignItems: "flex-end" }}>
                            <div style={{
                                width: "60%",
                                height: `${(steps / maxHourSteps) * 100}%`,
                                background: "var(--primary)",
                                borderRadius: "2px 2px 0 0",
                                minHeight: steps > 0 ? "2px" : "0"
                            }} />
                        </div>
                    ))}
                    
                    {/* X-Axis labels */}
                    <div style={{ position: "absolute", bottom: "-24px", left: 0, right: 0, display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--foreground-muted)" }}>
                        <span>12 AM</span>
                        <span>6 AM</span>
                        <span>12 PM</span>
                        <span>6 PM</span>
                        <span>12 AM</span>
                    </div>
                </div>

                <div style={{ marginTop: "40px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <h2 style={{ fontSize: "22px", fontWeight: "700", margin: 0 }}>Highlights</h2>
                    <button style={{ color: "var(--primary)", background: "none", border: "none", fontSize: "14px", cursor: "pointer" }}>Show All</button>
                </div>

                {/* Daily Highlight */}
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--primary)", fontWeight: "600", fontSize: "14px", marginBottom: "12px" }}>
                        <span style={{ fontSize: "16px" }}>🔥</span> Steps
                    </div>
                    <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 20px 0", lineHeight: "1.4" }}>
                        {todaySteps > yesterdaySteps 
                            ? "You're taking more steps today than you did yesterday."
                            : "So far, you're taking fewer steps than you normally do."}
                    </h3>
                    <div style={{ display: "flex", gap: "40px", marginBottom: "20px" }}>
                        <div>
                            <div style={{ fontSize: "12px", color: "var(--primary)", fontWeight: "600", marginBottom: "4px" }}>● Today</div>
                            <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--primary)" }}>{todaySteps.toLocaleString()} <span style={{ fontSize: "12px", fontWeight: "500" }}>steps</span></div>
                        </div>
                        <div>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)", fontWeight: "600", marginBottom: "4px" }}>● Average</div>
                            <div style={{ fontSize: "24px", fontWeight: "700", color: "white" }}>{weekAvg.toLocaleString()} <span style={{ fontSize: "12px", color: "var(--foreground-muted)", fontWeight: "500" }}>steps</span></div>
                        </div>
                    </div>
                </div>

                {/* Weekly Highlight */}
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--primary)", fontWeight: "600", fontSize: "14px", marginBottom: "12px" }}>
                        <span style={{ fontSize: "16px" }}>🔥</span> Steps
                    </div>
                    <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 20px 0", lineHeight: "1.4" }}>
                        You averaged {weekAvg.toLocaleString()} steps a day over the last 7 days.
                    </h3>
                    
                    <div style={{ height: "120px", position: "relative", display: "flex", alignItems: "flex-end", gap: "10px", marginTop: "30px" }}>
                        {/* Avg Line */}
                        <div style={{ 
                            position: "absolute", 
                            top: `${100 - (weekAvg / maxWeekSteps) * 100}%`, 
                            left: 0, right: 0, 
                            borderTop: "2px solid var(--primary)", 
                            zIndex: 0 
                        }}>
                            <div style={{ position: "absolute", top: "-24px", left: "0", fontSize: "12px", fontWeight: "600", color: "var(--foreground-muted)" }}>
                                Average Steps
                            </div>
                        </div>

                        {weeklyBuckets.map((steps, i) => (
                            <div key={i} style={{ flex: 1, zIndex: 1, display: "flex", justifyContent: "center", height: "100%", alignItems: "flex-end" }}>
                                <div style={{
                                    width: "80%",
                                    height: `${(steps / maxWeekSteps) * 100}%`,
                                    background: "rgba(255,255,255,0.2)",
                                    borderRadius: "4px 4px 0 0"
                                }} />
                            </div>
                        ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "12px", color: "var(--foreground-muted)" }}>
                        {["M","T","W","T","F","S","S"].map((d, i) => <span key={i} style={{ flex: 1, textAlign: "center" }}>{d}</span>)}
                    </div>
                </div>

                {/* Monthly Highlight */}
                <h2 style={{ fontSize: "20px", fontWeight: "700", marginTop: "30px", marginBottom: "16px" }}>Monthly Highlights</h2>
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--primary)", fontWeight: "600", fontSize: "14px", marginBottom: "12px" }}>
                        <span style={{ fontSize: "16px" }}>🔥</span> Steps
                    </div>
                    <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 24px 0", lineHeight: "1.4" }}>
                        {monthAvg > lastMonthAvg 
                            ? `You're averaging ${(monthAvg - lastMonthAvg).toLocaleString()} more steps this month than last month.` 
                            : `You're averaging ${(lastMonthAvg - monthAvg).toLocaleString()} fewer steps this month than last month.`}
                    </h3>
                    
                    <div style={{ marginBottom: "20px" }}>
                        <div style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>{monthAvg.toLocaleString()} <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>steps/day</span></div>
                        <div style={{ width: "80%", background: "var(--primary)", color: "black", padding: "4px 12px", fontSize: "14px", fontWeight: "700", borderRadius: "4px" }}>
                            {new Date().toLocaleString('default', { month: 'long' })}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px", color: "white" }}>{lastMonthAvg.toLocaleString()} <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>steps/day</span></div>
                        <div style={{ width: "100%", background: "rgba(255,255,255,0.1)", color: "var(--foreground-muted)", padding: "4px 12px", fontSize: "14px", fontWeight: "700", borderRadius: "4px" }}>
                            {new Date(new Date().setMonth(new Date().getMonth()-1)).toLocaleString('default', { month: 'long' })}
                        </div>
                    </div>
                </div>

                {/* Yearly Highlight */}
                <h2 style={{ fontSize: "20px", fontWeight: "700", marginTop: "30px", marginBottom: "16px" }}>Yearly Highlights</h2>
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--primary)", fontWeight: "600", fontSize: "14px", marginBottom: "12px" }}>
                        <span style={{ fontSize: "16px" }}>🔥</span> Steps
                    </div>
                    <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 24px 0", lineHeight: "1.4" }}>
                        {yearAvg > lastYearAvg 
                            ? `This year, you're walking more on average than you did in ${new Date().getFullYear()-1}.` 
                            : `This year, you're walking less on average than you did in ${new Date().getFullYear()-1}.`}
                    </h3>
                    
                    <div style={{ marginBottom: "20px" }}>
                        <div style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>{yearAvg.toLocaleString()} <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>steps/day</span></div>
                        <div style={{ width: "80%", background: "var(--primary)", color: "black", padding: "4px 12px", fontSize: "14px", fontWeight: "700", borderRadius: "4px" }}>
                            {new Date().getFullYear()}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px", color: "white" }}>{lastYearAvg.toLocaleString()} <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>steps/day</span></div>
                        <div style={{ width: "100%", background: "rgba(255,255,255,0.1)", color: "var(--foreground-muted)", padding: "4px 12px", fontSize: "14px", fontWeight: "700", borderRadius: "4px" }}>
                            {new Date().getFullYear()-1}
                        </div>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
