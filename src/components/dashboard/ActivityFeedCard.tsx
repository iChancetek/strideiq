"use client";

import { Activity } from "@/hooks/useActivities";
import { useLikes } from "@/hooks/useLikes";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import Link from "next/link";
import CommentsSection from "./activity/CommentsSection"; // Keep original import
import { useSettings } from "@/context/SettingsContext";
import { t } from "@/lib/translations";
import { getWorkoutMetabolicInsight } from "@/lib/utils/workoutIntelligence";
import { getFastingStage } from "@/lib/utils/fastingStages";


interface Props {
    activity: Activity;
    ownerName: string;
    ownerPhoto?: string;
    ownerId: string;
}

export default function ActivityFeedCard({ activity, ownerName, ownerPhoto, ownerId }: Props) {
    const { user } = useAuth();
    const { settings } = useSettings();
    const lang = settings.language;
    const { likeCount, isLiked, toggleLike, likes } = useLikes(ownerId, activity.id);
    const [showComments, setShowComments] = useState(false);
    const [currentMediaIdx, setCurrentMediaIdx] = useState(0);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const EMOJIS = ["👍", "👍🏻", "👍🏼", "👍🏽", "👍🏾", "👍🏿"];

    const formatDuration = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = Math.floor(totalSeconds % 60);
        if (h > 0) return `${h}h ${m}m ${s}s`;
        return `${m}m ${s}s`;
    };

    const modeIcon = activity.mode === "run" ? "🏃" : 
                     activity.mode === "walk" ? "🚶" : 
                     activity.mode === "hike" ? "🥾" : 
                     activity.mode === "bike" ? "🚴" : 
                     activity.mode === "meditation" ? "🧘" : 
                     activity.mode === "fasting" ? "⏱️" : 
                     activity.mode === "Journal" ? "📓" : "⏱️";

    const activityTitle = activity.title || `${t(lang, activity.type.toLowerCase() as any) || activity.type} • ${activity.date.toLocaleDateString()}`;
    const timeAgo = getTimeAgo(activity.date, lang); // Pass lang

    return (
        <div className="glass-panel" style={{
            borderRadius: "var(--radius-lg, 16px)",
            overflow: "hidden",
            marginBottom: "20px",
        }}>
            {/* Header — User info */}
            <div 
                onClick={() => {
                    if (user?.uid === ownerId) {
                        window.location.href = `/dashboard/activities/${activity.id}`;
                    }
                }}
                style={{
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: user?.uid === ownerId ? "pointer" : "default"
                }}
            >
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
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ fontWeight: 600, fontSize: "15px" }}>{ownerName}</div>
                        {user?.uid === ownerId && (
                            <span style={{ 
                                fontSize: "10px", 
                                background: "rgba(204, 255, 0, 0.1)", 
                                color: "var(--primary)", 
                                padding: "2px 6px", 
                                borderRadius: "4px",
                                fontWeight: 800,
                                textTransform: "uppercase"
                            }}>Edit</span>
                        )}
                    </div>
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
                        <div style={{ fontSize: "11px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{t(lang, "time")}</div>
                        <div style={{ fontSize: "18px", fontWeight: 700 }}>{formatDuration(activity.duration)}</div>
                    </div>
                    {activity.distance > 0 && (
                        <div>
                            <div style={{ fontSize: "11px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{t(lang, "distance")}</div>
                            <div style={{ fontSize: "18px", fontWeight: 700 }}>{(Number(activity.distance) || 0).toFixed(1)} {settings.units === "imperial" ? "mi" : "km"}</div>
                        </div>
                    )}
                    {activity.pace && activity.pace !== "0'00\"/mi" && activity.pace !== "--" && (
                        <div>
                            <div style={{ fontSize: "11px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{t(lang, "pace")}</div>
                            <div style={{ fontSize: "18px", fontWeight: 700 }}>{activity.pace}</div>
                        </div>
                    )}
                    {activity.calories !== undefined && activity.calories > 0 && (
                        <div>
                            <div style={{ fontSize: "11px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{t(lang, "calories")}</div>
                            <div style={{ fontSize: "18px", fontWeight: 700 }}>{activity.calories}</div>
                        </div>
                    )}
                    {activity.steps !== undefined && activity.steps > 0 && (
                        <div>
                            <div style={{ fontSize: "11px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{t(lang, "steps")}</div>
                            <div style={{ fontSize: "18px", fontWeight: 700 }}>{activity.steps.toLocaleString()}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Metabolic Intelligence Row */}
            {activity.type !== "Journal" && (

                <div style={{ margin: "0 20px 20px" }}>
                    {activity.type === "Fasting" ? (
                        <div style={{ 
                            padding: "12px 16px", 
                            background: "rgba(255,255,255,0.02)", 
                            borderRadius: "14px", 
                            border: "1px solid rgba(255,255,255,0.05)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px"
                        }}>
                             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "11px", color: "var(--foreground-muted)", textTransform: "uppercase" }}>STARTED</span>
                                <span style={{ fontSize: "13px", fontWeight: 600 }}>{activity.startTime ? new Date(activity.startTime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : activity.date.toLocaleString()}</span>
                             </div>
                             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "11px", color: "var(--foreground-muted)", textTransform: "uppercase" }}>FINISHED</span>
                                <span style={{ fontSize: "13px", fontWeight: 600 }}>{activity.endTime ? new Date(activity.endTime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Ongoing"}</span>
                             </div>
                        </div>
                    ) : (
                        (() => {
                            const insight = getWorkoutMetabolicInsight(activity.type, activity.pace || "0:00", activity.duration);
                            return (
                                <div style={{ 
                                    padding: "14px", 
                                    background: `linear-gradient(135deg, ${insight.color}0a, ${insight.color}15)`, 
                                    borderRadius: "14px", 
                                    border: `1px solid ${insight.color}33`,
                                    display: "flex",
                                    gap: "12px",
                                    alignItems: "center"
                                }}>
                                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: insight.color, boxShadow: `0 0 8px ${insight.color}` }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", gap: "8px", alignItems: "baseline", marginBottom: "2px" }}>
                                            <span style={{ fontSize: "12px", fontWeight: 800, color: insight.color, textTransform: "uppercase" }}>{insight.label}</span>
                                            <span style={{ fontSize: "14px", fontWeight: 600 }}>{insight.value}</span>
                                        </div>
                                        <div style={{ fontSize: "12px", color: "var(--foreground-muted)", lineHeight: 1.4 }}>{insight.description}</div>
                                    </div>
                                </div>
                            );
                        })()
                    )}
                </div>
            )}


            {/* AI Coaching Analysis */}
            {activity.aiAnalysis && (
                <div style={{ 
                    margin: "0 20px 20px", 
                    padding: "16px", 
                    borderRadius: "var(--radius-md)", 
                    background: "linear-gradient(135deg, rgba(0, 229, 255, 0.05), rgba(0, 229, 255, 0.1))", 
                    border: "1px solid rgba(0, 229, 255, 0.2)",
                    position: "relative",
                    overflow: "hidden"
                }}>
                    <div style={{ 
                        position: "absolute", 
                        top: 0, 
                        right: 0, 
                        padding: "4px 12px", 
                        background: "var(--primary)", 
                        color: "#000", 
                        fontSize: "10px", 
                        fontWeight: 800, 
                        borderBottomLeftRadius: "12px",
                        textTransform: "uppercase"
                    }}>
                        Elite Tier Analysis
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <div style={{ 
                            width: "48px", 
                            height: "48px", 
                            borderRadius: "50%", 
                            border: "2px solid var(--primary)", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            fontSize: "18px",
                            fontWeight: 800,
                            color: "var(--primary)"
                        }}>
                            {activity.aiAnalysis.score}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "12px", color: "var(--secondary)", fontWeight: 700, marginBottom: "2px" }}>COACH FEEDBACK</div>
                            <div style={{ fontSize: "14px", color: "var(--foreground)", lineHeight: 1.4 }}>{activity.aiAnalysis.feedback}</div>
                        </div>
                    </div>
                    <div style={{ display: "grid", gap: "8px" }}>
                        {activity.aiAnalysis.insights.map((insight: string, idx: number) => (
                            <div key={idx} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                                <span style={{ color: "var(--primary)" }}>✦</span>
                                {insight}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Notes / Content */}
            {(activity.notes || activity.content) && (
                <div style={{ padding: "0 20px 12px" }}>
                    <p style={{ 
                        fontSize: activity.type === "Journal" ? "16px" : "14px", 
                        color: activity.type === "Journal" ? "var(--foreground)" : "var(--foreground-muted)", 
                        lineHeight: "1.6",
                        whiteSpace: "pre-wrap"
                    }}>
                        {activity.content || activity.notes}
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
                                    width: "28px",
                                    height: "28px",
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.1)",
                                    border: "2px solid var(--surface, #111)",
                                    overflow: "visible",
                                    marginLeft: i > 0 ? "-10px" : "0",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    position: "relative"
                                }}>
                                    {l.userPhoto ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={l.userPhoto} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                                    ) : l.userName?.[0] || 'U'}
                                    <div style={{
                                        position: "absolute",
                                        bottom: "-2px",
                                        right: "-4px",
                                        fontSize: "12px",
                                        background: "var(--surface)",
                                        borderRadius: "50%",
                                        width: "16px",
                                        height: "16px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: "1px solid rgba(255,255,255,0.1)"
                                    }}>
                                        {l.emoji || "👍"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {likeCount > 0 && (
                        <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                            {likeCount === 1 ? `1 ${t(lang, "kudos")}` : `${likeCount} ${t(lang, "kudos")}`}
                        </span>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{
                display: "flex",
                borderTop: "1px solid rgba(255,255,255,0.05)",
            }}>
                <div style={{ flex: 1, position: "relative" }}>
                    <button
                        onClick={() => toggleLike(EMOJIS[0])}
                        onMouseEnter={() => setShowEmojiPicker(true)}
                        onMouseLeave={() => setShowEmojiPicker(false)}
                        style={{
                            width: "100%",
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
                        {isLiked ? (likes.find(l => l.userId === user?.uid)?.emoji || "👍") : "👍"} {t(lang, "kudos")}
                    </button>
                    
                    {/* Emoji Picker Popover */}
                    {showEmojiPicker && (
                        <div 
                            onMouseEnter={() => setShowEmojiPicker(true)}
                            onMouseLeave={() => setShowEmojiPicker(false)}
                            style={{
                            position: "absolute",
                            bottom: "100%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "rgba(20, 20, 20, 0.95)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "30px",
                            padding: "8px 12px",
                            display: "flex",
                            gap: "10px",
                            zIndex: 100,
                            marginBottom: "8px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
                        }}>
                            {EMOJIS.map(e => (
                                <button 
                                    key={e} 
                                    onClick={() => { toggleLike(e); setShowEmojiPicker(false); }}
                                    style={{
                                        fontSize: "20px",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: "4px",
                                        transition: "transform 0.2s",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}
                                    className="emoji-btn"
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
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
                    💬 {t(lang, "comment")}
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

function getTimeAgo(date: Date, lang: any): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return t(lang, "justNow");
    if (diffMin < 60) return `${diffMin}${t(lang, "minutesAgo")}`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}${t(lang, "hoursAgo")}`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return t(lang, "yesterday");
    if (diffDay < 7) return `${diffDay}${t(lang, "daysAgo")}`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
