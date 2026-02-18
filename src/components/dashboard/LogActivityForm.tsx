"use client";

import { useState } from "react";
import { useActivities } from "@/hooks/useActivities";

const CALORIE_RATES: Record<string, number> = {
    Run: 110,   // per mile
    Walk: 80,
    Bike: 50,
    HIIT: 150,
};

const STEPS_PER_MILE: Record<string, number> = {
    Run: 1400,
    Walk: 2100,
    Bike: 0,
    HIIT: 800,
};

export default function LogActivityForm({ onSuccess }: { onSuccess?: () => void }) {
    const { addActivity } = useActivities();
    const [type, setType] = useState<"Run" | "Walk" | "Bike" | "HIIT">("Run");
    const [distance, setDistance] = useState("");
    const [durationMin, setDurationMin] = useState("");
    const [durationSec, setDurationSec] = useState("");
    const [notes, setNotes] = useState("");
    const [stepsInput, setStepsInput] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        const dist = parseFloat(distance);
        const durSec = (parseInt(durationMin) || 0) * 60 + (parseInt(durationSec) || 0);

        if (!dist || dist <= 0) {
            setError("Please enter a valid distance.");
            setLoading(false);
            return;
        }
        if (durSec <= 0) {
            setError("Please enter a valid duration.");
            setLoading(false);
            return;
        }

        try {
            const estimatedSteps = stepsInput
                ? parseInt(stepsInput)
                : Math.round(dist * (STEPS_PER_MILE[type] || 1400));

            await addActivity({
                type,
                distance: dist,
                duration: durSec, // seconds — matches Zod schema
                date: new Date(date + "T12:00:00"),
                calories: Math.round(dist * (CALORIE_RATES[type] || 100)),
                steps: estimatedSteps,
                notes,
            });
            setDistance("");
            setDurationMin("");
            setDurationSec("");
            setNotes("");
            setStepsInput("");
            setDate(new Date().toISOString().split("T")[0]);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to save activity");
        } finally {
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "12px",
        borderRadius: "var(--radius-sm)",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#fff",
        outline: "none",
    };

    return (
        <div className="glass-panel" style={{ padding: "24px", borderRadius: "var(--radius-lg)" }}>
            <h3 style={{ marginBottom: "20px" }}>Log Activity</h3>

            {success && (
                <div style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "rgba(0,229,128,0.1)", border: "1px solid rgba(0,229,128,0.3)", color: "#00e580", fontSize: "14px", marginBottom: "16px" }}>
                    ✓ Activity saved!
                </div>
            )}

            {error && (
                <div style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.3)", color: "#ff4444", fontSize: "14px", marginBottom: "16px" }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--foreground-muted)" }}>Type</label>
                        <select value={type} onChange={(e) => setType(e.target.value as any)} style={inputStyle}>
                            <option value="Run">🏃 Run</option>
                            <option value="Walk">🚶 Walk</option>
                            <option value="Bike">🚴 Bike</option>
                            <option value="HIIT">💥 HIIT</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--foreground-muted)" }}>Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            style={inputStyle}
                        />
                    </div>
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
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--foreground-muted)" }}>Duration</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <input
                            type="number"
                            value={durationMin}
                            onChange={(e) => setDurationMin(e.target.value)}
                            required
                            placeholder="Min"
                            min="0"
                            style={inputStyle}
                        />
                        <input
                            type="number"
                            value={durationSec}
                            onChange={(e) => setDurationSec(e.target.value)}
                            placeholder="Sec"
                            min="0"
                            max="59"
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--foreground-muted)" }}>Notes</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="How did it feel?"
                        rows={3}
                        style={{ ...inputStyle, resize: "none" }}
                    />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "var(--foreground-muted)" }}>Steps (optional)</label>
                        <input
                            type="number"
                            value={stepsInput}
                            onChange={(e) => setStepsInput(e.target.value)}
                            placeholder={distance ? String(Math.round(parseFloat(distance) * (STEPS_PER_MILE[type] || 1400))) : "Auto"}
                            min="0"
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "12px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                        {!stepsInput && distance ? `≈ ${Math.round(parseFloat(distance) * (STEPS_PER_MILE[type] || 1400)).toLocaleString()} estimated` : ""}
                    </div>
                </div>

                <div style={{ fontSize: "13px", color: "var(--foreground-muted)", textAlign: "right" }}>
                    Est. calories: {distance ? Math.round(parseFloat(distance) * (CALORIE_RATES[type] || 100)) : "—"} kcal
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ marginTop: "4px", justifyContent: "center", opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? "Saving..." : "Save Activity"}
                </button>
            </form>
        </div>
    );
}
