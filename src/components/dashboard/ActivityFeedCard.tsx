"use client";

import { Activity } from "@/hooks/useActivities";
import { useLikes } from "@/hooks/useLikes";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import Link from "next/link";
import CommentsSection from "./activity/CommentsSection";

interface Props {
    activity: Activity;
    ownerName: string;
    ownerPhoto?: string;
    ownerId: string;
}

export default function ActivityFeedCard({ activity, ownerName, ownerPhoto, ownerId }: Props) {
    const { user } = useAuth();
    const { likeCount, isLiked, toggleLike, likes } = useLikes(ownerId, activity.id);
    const [showComments, setShowComments] = useState(false);
    const [currentMediaIdx, setCurrentMediaIdx] = useState(0);

    const formatDuration = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = Math.floor(totalSeconds % 60);
        if (h > 0) return `${h}h ${m}m ${s}s`;
        return `${m}m ${s}s`;
    };

    const modeIcon = activity.mode === "run" ? "🏃" : activity.mode === "walk" ? "🚶" : activity.mode === "hike" ? "🥾" : "🚴";
    const activityTitle = activity.title || `${activity.type} on ${activity.date.toLocaleDateString()}`;
    const timeAgo = getTimeAgo(activity.date);

    return (
        <div className="glass-panel" style={{
            borderRadius: "var(--radius-lg, 16px)",
            overflow: "hidden",
            marginBottom: "20px",
        }}>
            {/* Header — User info */}
            <div style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
            }}>
                <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                    overflow: "hidden",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    {ownerPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ownerPhoto} alt={ownerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                        <span style={{ fontSize: "18px", fontWeight: 700 }}>{ownerName[0]}</span>
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "15px" }}>{ownerName}</div>
                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{timeAgo}</span>
                        <span>•</span>
                        <span>{modeIcon}</span>
                    </div>
                </div>
                <Link href={`/dashboard/activities/${activity.id}`} style={{ color: "var(--foreground-muted)", fontSize: "20px", textDecoration: "none" }}>
                    •••
                </Link>
            </div>

            {/* Activity Title + Stats */}
            <div style={{ padding: "0 20px 12px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px" }}>
                    {activityTitle}
                </h3>
                <div style={{
                    display: "flex",
                    gap: "24px",
                    flexWrap: "wrap",
                }}>
                    <div>
                        <div style={{ fontSize: "11px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Time</div>
                        <div style={{ fontSize: "18px", fontWeight: 700 }}>{formatDuration(activity.duration)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "11px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Distance</div>
                        <div style={{ fontSize: "18px", fontWeight: 700 }}>{activity.distance} mi</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "11px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Pace</div>
                        <div style={{ fontSize: "18px", fontWeight: 700 }}>{activity.pace}</div>
                    </div>
                    {activity.calories > 0 && (
                        <div>
                            <div style={{ fontSize: "11px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Cal</div>
                            <div style={{ fontSize: "18px", fontWeight: 700 }}>{activity.calories}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Notes */}
            {activity.notes && (
                <div style={{ padding: "0 20px 12px" }}>
                    <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: "1.5" }}>
                        {activity.notes}
                    </p>
                </div>
            )}

            {/* Media Gallery */}
            {activity.media && activity.media.length > 0 && (
                <div style={{ position: "relative" }}>
                    <div style={{
                        width: "100%",
                        aspectRatio: "16/10",
                        overflow: "hidden",
                        background: "#000",
                    }}>
                        {activity.media[currentMediaIdx]?.type === "video" ? (
                            <video
                                src={activity.media[currentMediaIdx].url}
                                controls
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={activity.media[currentMediaIdx]?.url}
                                alt="Activity"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        )}
                    </div>
                    {activity.media.length > 1 && (
                        <div style={{
                            position: "absolute",
                            bottom: "10px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            display: "flex",
                            gap: "6px",
                        }}>
                            {activity.media.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentMediaIdx(i)}
                                    style={{
                                        width: "8px",
                                        height: "8px",
                                        borderRadius: "50%",
                                        background: i === currentMediaIdx ? "#fff" : "rgba(255,255,255,0.4)",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: 0,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Kudos Bar */}
            <div style={{
                padding: "12px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid rgba(255,255,255,0.05)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {/* Like avatars */}
                    {likes.length > 0 && (
                        <div style={{ display: "flex", marginRight: "4px" }}>
                            {likes.slice(0, 3).map((l, i) => (
                                <div key={l.userId} style={{
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.1)",
                                    border: "2px solid var(--surface, #111)",
                                    overflow: "hidden",
                                    marginLeft: i > 0 ? "-8px" : "0",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "10px",
                                    fontWeight: 700,
                                }}>
                                    {l.userPhoto ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={l.userPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : l.userName[0]}
                                </div>
                            ))}
                        </div>
                    )}
                    {likeCount > 0 && (
                        <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                            {likeCount === 1 ? "1 kudo" : `${likeCount} kudos`}
                        </span>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{
                display: "flex",
                borderTop: "1px solid rgba(255,255,255,0.05)",
            }}>
                <button
                    onClick={toggleLike}
                    style={{
                        flex: 1,
                        padding: "12px",
                        background: "none",
                        border: "none",
                        borderRight: "1px solid rgba(255,255,255,0.05)",
                        color: isLiked ? "var(--primary)" : "var(--foreground-muted)",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: isLiked ? 700 : 500,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "color 0.2s",
                    }}
                >
                    {isLiked ? "👍" : "👍"} Kudos
                </button>
                <button
                    onClick={() => setShowComments(!showComments)}
                    style={{
                        flex: 1,
                        padding: "12px",
                        background: "none",
                        border: "none",
                        color: "var(--foreground-muted)",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                    }}
                >
                    💬 Comment
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <CommentsSection activityId={activity.id} ownerId={ownerId} />
                </div>
            )}
        </div>
    );
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
