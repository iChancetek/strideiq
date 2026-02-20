"use client";

import { useState } from "react";
import { useActivities } from "@/hooks/useActivities";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function ManualActivityModal({ isOpen, onClose }: Props) {
    const { addActivity } = useActivities();
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState("");
    const [type, setType] = useState<"Run" | "Walk" | "Bike" | "Hike">("Run");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [time, setTime] = useState("12:00");
    const [distance, setDistance] = useState("0");
    const [hours, setHours] = useState("0");
    const [minutes, setMinutes] = useState("0");
    const [seconds, setSeconds] = useState("0");
    const [notes, setNotes] = useState("");

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const h = parseInt(hours) || 0;
            const m = parseInt(minutes) || 0;
            const s = parseInt(seconds) || 0;
            const durationSeconds = h * 3600 + m * 60 + s;
            const distanceMiles = parseFloat(distance) || 0;

            if (durationSeconds <= 0) {
                throw new Error("Duration must be greater than 0");
            }
            if (distanceMiles <= 0) {
                throw new Error("Distance must be greater than 0");
            }

            // Calculate rough calories based on mode
            let calPerMile = 100;
            if (type === "Walk") calPerMile = 80;
            if (type === "Bike") calPerMile = 45;
            if (type === "Hike") calPerMile = 120;
            const calories = Math.round(distanceMiles * calPerMile);

            // Construct Date object
            const activityDate = new Date(`${date}T${time}:00`);

            await addActivity({
                title: title || `Manual ${type}`,
                type,
                mode: type.toLowerCase() as any,
                distance: distanceMiles,
                duration: durationSeconds,
                date: activityDate,
                calories,
                notes: notes,
                isPublic: true,
                environment: "outdoor"
            });

            // Need to reload window or let snapshot update. The snapshot in useActivities handles it!
            onClose();
        } catch (e: any) {
            console.error("Save error:", e);
            alert(`Failed to save manual activity: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
        }}>
            <div className="glass-panel" style={{
                width: "100%",
                maxWidth: "500px",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "30px",
                borderRadius: "var(--radius-lg)",
                position: "relative"
            }}>
                <button
                    onClick={onClose}
                    disabled={loading}
                    style={{
                        position: "absolute",
                        top: "20px",
                        right: "20px",
                        background: "none",
                        border: "none",
                        color: "var(--foreground-muted)",
                        fontSize: "24px",
                        cursor: "pointer"
                    }}
                >
                    &times;
                </button>

                <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "20px" }}>Log Manual Activity</h2>

                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>

                    {/* Activity Type & Date */}
                    <div style={{ display: "flex", gap: "15px" }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Type</label>
                            <select value={type} onChange={e => setType(e.target.value as any)} style={inputStyle} disabled={loading}>
                                <option value="Run">Run</option>
                                <option value="Walk">Walk</option>
                                <option value="Bike">Bike</option>
                                <option value="Hike">Hike</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={inputStyle} disabled={loading} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Time</label>
                            <input type="time" value={time} onChange={e => setTime(e.target.value)} required style={inputStyle} disabled={loading} />
                        </div>
                    </div>

                    {/* Distance */}
                    <div>
                        <label style={labelStyle}>Distance (Miles)</label>
                        <input type="number" step="0.01" min="0.01" value={distance} onChange={e => setDistance(e.target.value)} required style={inputStyle} disabled={loading} placeholder="e.g. 6.0" />
                    </div>

                    {/* Duration */}
                    <div>
                        <label style={labelStyle}>Duration</label>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <div style={{ flex: 1 }}>
                                <input type="number" value={hours} onChange={e => setHours(e.target.value)} min="0" style={inputStyle} disabled={loading} placeholder="Hrs" />
                                <div style={subLabelStyle}>Hours</div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <input type="number" value={minutes} onChange={e => setMinutes(e.target.value)} min="0" max="59" style={inputStyle} disabled={loading} placeholder="Min" />
                                <div style={subLabelStyle}>Minutes</div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <input type="number" value={seconds} onChange={e => setSeconds(e.target.value)} min="0" max="59" style={inputStyle} disabled={loading} placeholder="Sec" />
                                <div style={subLabelStyle}>Seconds</div>
                            </div>
                        </div>
                    </div>

                    {/* Title & Notes */}
                    <div>
                        <label style={labelStyle}>Title (Optional)</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} disabled={loading} placeholder="e.g. Evening Run" />
                    </div>
                    <div>
                        <label style={labelStyle}>Notes (Optional)</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} disabled={loading} placeholder="How did it feel?" />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "10px", padding: "12px", justifyContent: "center", opacity: loading ? 0.7 : 1 }}>
                        {loading ? "Saving..." : "Save Activity"}
                    </button>

                </form>
            </div>
        </div>
    );
}

const labelStyle = {
    display: "block",
    marginBottom: "5px",
    fontSize: "13px",
    color: "var(--foreground-muted)",
    fontWeight: 500
};

const subLabelStyle = {
    fontSize: "11px",
    color: "var(--foreground-muted)",
    marginTop: "4px",
    textAlign: "center" as const
};

const inputStyle = {
    width: "100%",
    padding: "10px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "var(--radius-sm)",
    color: "#fff",
    outline: "none",
    fontSize: "14px"
};
