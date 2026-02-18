"use client";

import { Crown, Timer, Route as RouteIcon } from "lucide-react";
import Link from "next/link";

interface RecordItem {
    value: number;
    activityId: string;
    date: any;
    display: string;
}

interface RecordsMap {
    fastestMile?: RecordItem;
    longestRun?: RecordItem;
    longestDistance?: RecordItem;
}

function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "255, 255, 255";
}

function RecordRow({ icon: Icon, label, value, date, id, color }: any) {
    // Format date if possible
    const dateStr = date?.toDate ? date.toDate().toLocaleDateString() : (new Date(date).toLocaleDateString() || "");

    return (
        <Link href={`/dashboard/activities/${id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", transition: "background 0.2s" }} className="hover-bg-glass">
                <div style={{
                    width: "40px", height: "40px", borderRadius: "10px",
                    background: `rgba(${hexToRgb(color)}, 0.1)`,
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <Icon size={20} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>{label}</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold" }}>{value}</div>
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>{dateStr}</div>
            </div>
        </Link>
    );
}

export default function PersonalRecords({ records = {} }: { records?: RecordsMap }) {
    if (!records || Object.keys(records).length === 0) {
        return (
            <div className="glass-panel" style={{ padding: "20px", borderRadius: "16px", minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center" }}>
                <Crown size={48} color="#333" style={{ marginBottom: "16px" }} />
                <h3 style={{ marginBottom: "8px", fontSize: "18px", fontWeight: "bold" }}>Personal Records</h3>
                <div style={{ color: "var(--foreground-muted)" }}>No records set yet.</div>
                <div style={{ fontSize: "12px", color: "#666" }}>Training starts now!</div>
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{ padding: "20px", borderRadius: "16px" }}>
            <h3 style={{ marginBottom: "20px", fontSize: "18px", fontWeight: "bold" }}>Personal Records</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {records.fastestMile && (
                    <RecordRow
                        icon={Timer}
                        label="Fastest Mile"
                        value={records.fastestMile.display}
                        date={records.fastestMile.date}
                        id={records.fastestMile.activityId}
                        color="#00e5ff"
                    />
                )}
                {records.longestRun && (
                    <RecordRow
                        icon={RouteIcon}
                        label="Longest Run"
                        value={records.longestRun.display}
                        date={records.longestRun.date}
                        id={records.longestRun.activityId}
                        color="#ff0055"
                    />
                )}
                {records.longestDistance && !records.longestRun && (
                    <RecordRow
                        icon={RouteIcon}
                        label="Longest Activity"
                        value={records.longestDistance.display}
                        date={records.longestDistance.date}
                        id={records.longestDistance.activityId}
                        color="#ccff00"
                    />
                )}
            </div>
        </div>
    );
}
