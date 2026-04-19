"use client";

import { Activity } from "@/hooks/useActivities";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface Props {
    activity: Activity;
}

export default function PaceAnalysisChart({ activity }: Props) {
    // If we only have mileSplits, we build a data array for it. 
    // If they don't exist, we'll gracefully mock based on average pace.
    let data: any[] = [];
    let avgPaceSeconds = 0;

    // Helper: mm:ss string to seconds
    const parsePace = (paceStr: string) => {
        if (!paceStr) return 0;
        const pts = paceStr.replace(/[^0-9:]/g, "").split(":");
        if (pts.length === 2) return parseInt(pts[0]) * 60 + parseInt(pts[1]);
        return parseInt(paceStr) || 0;
    };

    // Helper: seconds to mm:ss string
    const formatPace = (sec: number) => {
        if (!sec || isNaN(sec)) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.round(sec % 60);
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    if (activity.mileSplits && activity.mileSplits.length > 0) {
        data = activity.mileSplits.map((sec, idx) => ({
            mile: String(idx + 1),
            seconds: sec,
        }));
        avgPaceSeconds = activity.mileSplits.reduce((a, b) => a + b, 0) / activity.mileSplits.length;
    } else {
        // Build mock distribution around the avg pace for visual flair
        avgPaceSeconds = parsePace(activity.pace);
        const dist = Math.max(1, Math.floor(activity.distance || 0));
        for (let i = 1; i <= dist; i++) {
            // Random jitter +/- 15 seconds
            const jitter = (Math.random() - 0.5) * 30;
            data.push({ mile: String(i), seconds: Math.max(60, avgPaceSeconds + jitter) });
        }
    }

    if (data.length === 0) return null;

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.2)", padding: "8px", borderRadius: "4px", fontSize: "12px", color: "#fff" }}>
                    {`Mile ${payload[0].payload.mile}: ${formatPace(payload[0].value)}`}
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ background: "var(--surface, #fff)", padding: "24px 0", marginBottom: "20px" }}>
            <div style={{ padding: "0 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                    <div style={{ width: "16px", height: "16px", background: "var(--primary, #ff4400)", clipPath: "polygon(0 0, 100% 50%, 0 100%)" }} />
                    <h3 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "var(--foreground, #fff)" }}>Pace Analysis</h3>
                </div>
            </div>

            <div style={{ height: "200px", width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorPace" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.5}/>
                                <stop offset="95%" stopColor="#4A90E2" stopOpacity={0.8}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={true} horizontal={false} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3"/>
                        <XAxis dataKey="mile" tick={{fill: 'var(--foreground-muted)', fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis 
                            reversed={true} // Faster pace (lower seconds) at the top
                            tickFormatter={formatPace} 
                            tick={{fill: 'var(--foreground-muted)', fontSize: 10}} 
                            tickLine={false} 
                            axisLine={false}
                            domain={['dataMin - 15', 'dataMax + 15']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={avgPaceSeconds} stroke="var(--foreground-muted)" strokeDasharray="3 3" />
                        <Area type="stepAfter" dataKey="seconds" stroke="none" fillOpacity={1} fill="url(#colorPace)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            
            <div style={{ padding: "16px 20px 0" }}>
                <p style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: "1.5" }}>
                    All the splits you record get detailed breakdowns and sharp visualizations with Pace Analysis.
                </p>
                <div style={{ marginTop: "12px" }}>
                    <span style={{ color: "var(--primary, #ff4d00)", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>Subscribe Now</span>
                </div>
            </div>
        </div>
    );
}
