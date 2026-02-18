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

interface Activity {
    id: string;
    date: Date;
    distance: number;
    duration: number;
    type: string;
}

interface ActivityHistoryChartsProps {
    activities: Activity[];
}

export default function ActivityHistoryCharts({ activities }: ActivityHistoryChartsProps) {
    const monthlyData = useMemo(() => {
        const data: Record<string, number> = {};
        const now = new Date();
        const months = [];

        // Generate last 6 months labels
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('default', { month: 'short' });
            data[key] = 0;
            months.push({ key, label });
        }

        // Aggregate distance
        activities.forEach(activity => {
            const d = new Date(activity.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (data[key] !== undefined) {
                data[key] += activity.distance;
            }
        });

        return months.map(m => ({
            name: m.label,
            miles: Number(data[m.key].toFixed(2))
        }));
    }, [activities]);

    if (activities.length === 0) return null;

    return (
        <div className="glass-panel" style={{ padding: "20px", borderRadius: "var(--radius-lg)", marginBottom: "30px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>Monthly Mileage</h3>
            <div style={{ height: "250px", width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--foreground-muted)', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--foreground-muted)', fontSize: 12 }}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{
                                backgroundColor: 'var(--background-elevated)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--foreground)'
                            }}
                        />
                        <Bar dataKey="miles" radius={[4, 4, 0, 0]}>
                            {monthlyData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="var(--primary)" />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
