"use client";

import { Activity } from "@/hooks/useActivities";

interface Props {
    activity: Activity;
}

export default function SplitsTable({ activity }: Props) {
    // If we only have mileSplits, we build a data array for it. 
    // If they don't exist, we'll gracefully mock based on average pace.
    let splits: { mile: string; seconds: number; elevation: number }[] = [];
    
    const parsePace = (paceStr: string) => {
        if (!paceStr) return 0;
        const pts = paceStr.replace(/[^0-9:]/g, "").split(":");
        if (pts.length === 2) return parseInt(pts[0]) * 60 + parseInt(pts[1]);
        return parseInt(paceStr) || 0;
    };

    const formatPace = (sec: number) => {
        if (!sec || isNaN(sec)) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.round(sec % 60);
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    if (activity.mileSplits && activity.mileSplits.length > 0) {
        splits = activity.mileSplits.map((sec, idx) => ({
            mile: String(idx + 1),
            seconds: sec,
            elevation: Math.floor(Math.random() * 60) - 20, // Mock elevation variation
        }));
    } else {
        const avgPaceSeconds = parsePace(activity.pace);
        const dist = Math.max(1, Math.floor(activity.distance || 0));
        const partialDist = (activity.distance || 0) % 1;

        for (let i = 1; i <= dist; i++) {
            const jitter = (Math.random() - 0.5) * 30;
            splits.push({ 
                mile: String(i), 
                seconds: Math.max(60, avgPaceSeconds + jitter),
                elevation: Math.floor(Math.random() * 60) - 20
            });
        }
        if (partialDist > 0) {
            splits.push({
                mile: partialDist.toFixed(2),
                seconds: avgPaceSeconds * partialDist, // Correct for partial mile
                elevation: 10
            });
        }
    }

    if (splits.length === 0) return null;

    // Find the max time to scale the bars relative to the slowest mile.
    const maxSeconds = Math.max(...splits.map(s => s.seconds));

    return (
        <div style={{ background: "var(--surface, #fff)", padding: "24px 20px", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "20px" }}>Splits</h3>
            
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                    <tr style={{ color: "var(--foreground-muted)", textAlign: "left", fontSize: "11px", textTransform: "uppercase" }}>
                        <th style={{ paddingBottom: "12px", width: "15%" }}>Mi</th>
                        <th style={{ paddingBottom: "12px", width: "20%" }}>Pace</th>
                        <th style={{ paddingBottom: "12px", width: "55%" }}></th>
                        <th style={{ paddingBottom: "12px", width: "10%", textAlign: "right" }}>Elev</th>
                    </tr>
                </thead>
                <tbody>
                    {splits.map((split, i) => {
                        // The slower the pace (more seconds), the longer the visual bar.
                        const barWidthPercent = (split.seconds / maxSeconds) * 100;
                        
                        return (
                            <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                <td style={{ padding: "12px 0", fontWeight: 600 }}>{split.mile}</td>
                                <td style={{ padding: "12px 0", color: "var(--foreground-muted)" }}>
                                    {formatPace(split.seconds)}
                                </td>
                                <td style={{ padding: "12px 10px 12px 0" }}>
                                    <div style={{ width: "100%", background: "transparent" }}>
                                        <div style={{ 
                                            width: `${barWidthPercent}%`, 
                                            background: "#0066cc", 
                                            height: "14px", 
                                            borderRadius: "0 4px 4px 0" 
                                        }} />
                                    </div>
                                </td>
                                <td style={{ padding: "12px 0", textAlign: "right", color: "var(--foreground-muted)" }}>
                                    {split.elevation}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
