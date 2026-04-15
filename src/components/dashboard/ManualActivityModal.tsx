"use client";

import { useState, useRef } from "react";
import { useActivities } from "@/hooks/useActivities";
import { uploadMediaFiles } from "@/lib/storage";
import { auth } from "@/lib/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import SpeechControls from "./SpeechControls";
import { useVoice } from "@/hooks/useVoice";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function ManualActivityModal({ isOpen, onClose }: Props) {
    const { addActivity } = useActivities();
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState("");
    const [type, setType] = useState<"Run" | "Walk" | "Bike" | "Hike" | "Meditation">("Run");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [time, setTime] = useState("12:00");
    const [distance, setDistance] = useState("0");
    const [hours, setHours] = useState("0");
    const [minutes, setMinutes] = useState("0");
    const [seconds, setSeconds] = useState("0");
    const [notes, setNotes] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [user] = useAuthState(auth);

    // Voice
    const { isRecording, isTranscribing, startRecording, stopRecording } = useVoice();

    const [calories, setCalories] = useState("0");
    const [steps, setSteps] = useState("0");
    const [elevation, setElevation] = useState("0");

    // Real-time Pace Calculation
    const getPaceStr = () => {
        const d = parseFloat(distance) || 0;
        const h = parseInt(hours) || 0;
        const m = parseInt(minutes) || 0;
        const s = parseInt(seconds) || 0;
        const totalSec = h * 3600 + m * 60 + s;
        
        if (d <= 0 || totalSec <= 0) return "--:--";
        const paceSecPerMile = totalSec / d;
        const paceM = Math.floor(paceSecPerMile / 60);
        const paceS = Math.floor(paceSecPerMile % 60);
        return `${paceM}'${paceS < 10 ? "0" : ""}${paceS}"/mi`;
    };

    const handleTranscription = async () => {
        const text = await stopRecording();
        if (text) setNotes(prev => prev + (prev ? " " : "") + text);
    };

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
            const cal = parseInt(calories) || 0;
            const stepCount = parseInt(steps) || 0;
            const elev = parseInt(elevation) || 0;

            if (durationSeconds <= 0) {
                throw new Error("Duration must be greater than 0");
            }
            if (type !== "Meditation" && distanceMiles <= 0) {
                throw new Error("Distance must be greater than 0");
            }

            // Construct Date object
            const activityDate = new Date(`${date}T${time}:00`);

            // 1. Handle Media Uploads if any
            let mediaItems: any[] = [];
            if (selectedFiles.length > 0 && user) {
                mediaItems = await uploadMediaFiles(selectedFiles, user.uid);
            }

            await addActivity({
                title: title || `Manual ${type}`,
                type,
                mode: type.toLowerCase() as any,
                distance: distanceMiles,
                duration: durationSeconds,
                date: activityDate,
                calories: cal || Math.round(distanceMiles * 100), // Fallback to estimate
                steps: stepCount,
                elevation: elev,
                notes: notes,
                media: mediaItems,
                isPublic: true,
                environment: "outdoor"
            });

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
                                <option value="Meditation">Meditation</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={inputStyle} disabled={loading} />
                        </div>
                    </div>

                    {/* Distance & Pace */}
                    {type !== "Meditation" && (
                    <div style={{ display: "flex", gap: "15px", alignItems: "flex-end" }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Distance (Miles)</label>
                            <input type="number" step="0.01" min="0.01" value={distance} onChange={e => setDistance(e.target.value)} required style={inputStyle} disabled={loading} placeholder="e.g. 6.0" />
                        </div>
                        <div style={{ flex: 1, padding: "10px", background: "rgba(204,255,0,0.05)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(204,255,0,0.1)", textAlign: "center" }}>
                            <div style={{ fontSize: "10px", color: "var(--primary)", fontWeight: 700, textTransform: "uppercase" }}>Avg Pace</div>
                            <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--primary)" }}>{getPaceStr()}</div>
                        </div>
                    </div>
                    )}

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

                    {/* Extra Stats */}
                    <div style={{ display: "flex", gap: "10px" }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Calories</label>
                            <input type="number" value={calories} onChange={e => setCalories(e.target.value)} style={inputStyle} disabled={loading} placeholder="Kcal" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Steps</label>
                            <input type="number" value={steps} onChange={e => setSteps(e.target.value)} style={inputStyle} disabled={loading} placeholder="Steps" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Elevation (ft)</label>
                            <input type="number" value={elevation} onChange={e => setElevation(e.target.value)} style={inputStyle} disabled={loading} placeholder="Gain" />
                        </div>
                    </div>

                    {/* Title & Notes */}
                    <div>
                        <label style={labelStyle}>Activity Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} disabled={loading} placeholder="e.g. Morning Jog" />
                    </div>
                    <div style={{ position: "relative" }}>
                        <label style={labelStyle}>Notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, minHeight: "100px", resize: "vertical", paddingRight: "50px" }} disabled={loading} placeholder="How did it feel?" />
                        <div style={{ position: "absolute", bottom: "10px", right: "10px" }}>
                            <SpeechControls 
                                onStartRecording={startRecording}
                                onStopRecording={handleTranscription}
                                isRecording={isRecording}
                                isTranscribing={isTranscribing}
                                showSpeaker={false}
                                size={14}
                            />
                        </div>
                    </div>

                    {/* Media Upload */}
                    <div>
                        <label style={labelStyle}>Photos / Videos</label>
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*,video/*"
                            onChange={(e) => {
                                if (e.target.files) setSelectedFiles(Array.from(e.target.files));
                            }}
                            ref={fileInputRef}
                            style={{ display: "none" }}
                        />
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "var(--radius-sm)",
                                    border: "1px dashed rgba(255,255,255,0.2)",
                                    background: "rgba(255,255,255,0.02)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "var(--foreground-muted)",
                                    cursor: "pointer"
                                }}
                            >
                                +
                            </button>
                            {selectedFiles.map((f, i) => (
                                <div key={i} style={{
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "var(--radius-sm)",
                                    background: "rgba(255,255,255,0.1)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "10px",
                                    position: "relative",
                                    overflow: "hidden"
                                }}>
                                    <span style={{ zIndex: 1, padding: "2px", textAlign: "center" }}>{f.name.substring(0, 10)}...</span>
                                    <button 
                                        type="button"
                                        onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                                        style={{
                                            position: "absolute",
                                            top: "2px",
                                            right: "2px",
                                            background: "rgba(0,0,0,0.5)",
                                            border: "none",
                                            color: "#fff",
                                            borderRadius: "50%",
                                            width: "16px",
                                            height: "16px",
                                            fontSize: "10px",
                                            cursor: "pointer",
                                            zIndex: 2
                                        }}
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "10px", padding: "12px", justifyContent: "center", opacity: loading ? 0.7 : 1 }}>
                        {loading ? "Saving Progress..." : "Save Activity"}
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
