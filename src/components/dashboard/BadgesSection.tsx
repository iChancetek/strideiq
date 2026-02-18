"use client";

import { Medal, Trophy, Award, Lock } from "lucide-react";

interface Badge {
    id: string;
    earnedAt?: any; // Firestore Timestamp
}

const BADGE_CONFIG: Record<string, { label: string, icon: any, color: string, description: string }> = {
    "25_miles": { label: "25 Miles", icon: Medal, color: "#cd7f32", description: "Ran a total of 25 miles" },
    "50_miles": { label: "50 Miles", icon: Medal, color: "#c0c0c0", description: "Ran a total of 50 miles" },
    "100_miles": { label: "100 Miles", icon: Medal, color: "#ffd700", description: "Ran a total of 100 miles" },
    "250_miles": { label: "250 Miles", icon: Trophy, color: "#00e5ff", description: "Ran a total of 250 miles" },
    "500_miles": { label: "500 Miles", icon: Trophy, color: "#ff0055", description: "Ran a total of 500 miles" },
    "1000_miles": { label: "1K Club", icon: Award, color: "#ccff00", description: "Ran a total of 1,000 miles" },
};

function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "255, 255, 255";
}

export default function BadgesSection({ badges = [] }: { badges?: Badge[] }) {
    const earnedSet = new Set(badges.map(b => b.id));

    return (
        <div className="glass-panel" style={{ padding: "20px", borderRadius: "16px" }}>
            <h3 style={{ marginBottom: "20px", fontSize: "18px", fontWeight: "bold" }}>Trophy Case</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "16px" }}>
                {Object.entries(BADGE_CONFIG).map(([id, config]) => {
                    const isEarned = earnedSet.has(id);
                    const Icon = config.icon;
                    return (
                        <div key={id} style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            textAlign: "center",
                            opacity: isEarned ? 1 : 0.5,
                        }} title={config.description}>
                            <div style={{
                                width: "60px",
                                height: "60px",
                                borderRadius: "50%",
                                background: isEarned ? `rgba(${hexToRgb(config.color)}, 0.1)` : "rgba(255,255,255,0.05)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "8px",
                                border: `1px solid ${isEarned ? config.color : "transparent"}`,
                                filter: isEarned ? "none" : "grayscale(100%)"
                            }}>
                                {isEarned ? (
                                    <Icon size={32} color={config.color} />
                                ) : (
                                    <Lock size={24} color="#666" />
                                )}
                            </div>
                            <div style={{ fontSize: "12px", color: isEarned ? "#fff" : "#666", fontWeight: isEarned ? 600 : 400 }}>
                                {config.label}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
