"use client";

import { useMemo } from "react";
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell
} from "recharts";
import { Activity } from "@/hooks/useActivities";

type Period = "daily" | "weekly" | "monthly" | "yearly";

interface Props {
    activities: Activity[];
    period: Period;
    activeYear?: number;
}

export default function ActivityCharts({ activities, period, activeYear = new Date().getFullYear() }: Props) {
    
    const chartData = useMemo(() => {
        const data: { name: string; value: number; label: string }[] = [];
        
        if (period === "daily") {
            // Hourly: 0-23
            for (let i = 0; i < 24; i++) {
                data.push({ 
                    name: i.toString(), 
                    label: `${i}:00`, 
                    value: 0 
                });
            }
            activities.forEach(a => {
                const hour = a.date.getHours();
                data[hour].value += (Number(a.distance) || 0);
            });
        } 
        else if (period === "weekly") {
            // Days of week: Sun-Sat
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            days.forEach((day, i) => {
                data.push({ name: i.toString(), label: day, value: 0 });
            });
            activities.forEach(a => {
                const day = a.date.getDay(); // 0 is Sunday
                data[day].value += (Number(a.distance) || 0);
            });
        } 
        else if (period === "monthly") {
            // Days of month: 1-31 (or actual days in month)
            const daysInMonth = 31; // Simplified
            for (let i = 1; i <= daysInMonth; i++) {
                data.push({ name: i.toString(), label: i.toString(), value: 0 });
            }
            activities.forEach(a => {
                const date = a.date.getDate();
                if (data[date - 1]) data[date - 1].value += (Number(a.distance) || 0);
            });
        } 
        else if (period === "yearly") {
            // Months: Jan-Dec
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            months.forEach((m, i) => {
                data.push({ name: i.toString(), label: m, value: 0 });
            });
            activities.forEach(a => {
                const month = a.date.getMonth();
                data[month].value += (Number(a.distance) || 0);
            });
        }

        return data;
    }, [activities, period]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ 
                    background: "rgba(0,0,0,0.85)", 
                    padding: "10px", 
                    borderRadius: "8px", 
                    border: "1px solid var(--primary)",
                    backdropFilter: "blur(4px)"
                }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--foreground-muted)" }}>{payload[0].payload.label}</p>
                    <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--primary)" }}>
                        {payload[0].value.toFixed(2)} mi
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ width: "100%", height: "200px", marginTop: "20px" }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                        dataKey="label" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: "var(--foreground-muted)", fontSize: 10 }}
                        interval={period === "monthly" ? 4 : 0}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: "var(--foreground-muted)", fontSize: 10 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                    <Bar 
                        dataKey="value" 
                        radius={[4, 4, 0, 0]}
                        animationDuration={1000}
                    >
                        {chartData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={entry.value > 0 ? "var(--primary)" : "rgba(255,255,255,0.1)"} 
                                style={{ transition: "all 0.3s ease" }}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
