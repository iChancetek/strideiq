"use client";

import { useState } from "react";
import { useActivities } from "@/hooks/useActivities";
import { useRouter } from "next/navigation";

export default function LogActivityForm({ onSuccess }: { onSuccess?: () => void }) {
    const { addActivity } = useActivities();
    const [type, setType] = useState<"Run" | "Walk">("Run");
    const [distance, setDistance] = useState("");
    const [duration, setDuration] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addActivity({
                type,
                distance: parseFloat(distance),
                duration: parseFloat(duration), // in minutes
                date: new Date(),
                calories: parseFloat(distance) * 100, // Rough estimate
                notes,
            });
            setDistance("");
            setDuration("");
            setNotes("");
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error(error);
            alert("Failed to save activity");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel" style={{ padding: "24px", borderRadius: "var(--radius-lg)" }}>
            <h3 style={{ marginBottom: "20px" }}>Log Activity</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--foreground-muted)" }}>Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as "Run" | "Walk")}
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "var(--radius-sm)",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#fff",
                                outline: "none"
                            }}
                        >
                            <option value="Run">Run</option>
                            <option value="Walk">Walk</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--foreground-muted)" }}>Distance (mi)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={distance}
                            onChange={(e) => setDistance(e.target.value)}
                            required
                            placeholder="0.00"
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "var(--radius-sm)",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#fff",
                                outline: "none"
                            }}
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--foreground-muted)" }}>Duration (min)</label>
                    <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        required
                        placeholder="30"
                        style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "var(--radius-sm)",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#fff",
                            outline: "none"
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--foreground-muted)" }}>Notes</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="How did it feel?"
                        rows={3}
                        style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "var(--radius-sm)",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#fff",
                            outline: "none",
                            resize: "none"
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ marginTop: "10px", justifyContent: "center", opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? "Saving..." : "Save Activity"}
                </button>
            </form>
        </div>
    );
}
