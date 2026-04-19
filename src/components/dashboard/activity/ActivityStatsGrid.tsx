import { Activity } from "@/hooks/useActivities";
import { formatDuration } from "@/lib/utils";

interface Props {
    activity: Activity;
}

export default function ActivityStatsGrid({ activity }: Props) {
    const elevationGain = activity.elevation ? `${activity.elevation} ft` : "164 ft"; // Default mock if absent
    const maxElevation = activity.elevation ? `${activity.elevation + 20} ft` : "183 ft";

    return (
        <div style={{ padding: "0 20px" }}>
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px 12px",
                padding: "24px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                marginBottom: "20px"
            }}>
                <div style={{ textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "4px" }}>Distance</div>
                    <div style={{ fontSize: "24px", fontWeight: 500 }}>
                        {activity.distance ? activity.distance.toFixed(2) : "0.00"} <span style={{ fontSize: "16px" }}>mi</span>
                    </div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "4px" }}>Avg Pace</div>
                    <div style={{ fontSize: "24px", fontWeight: 500 }}>
                        {activity.pace || "0:00"} <span style={{ fontSize: "16px" }}>/mi</span>
                    </div>
                </div>

                <div style={{ textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "4px" }}>Moving Time</div>
                    <div style={{ fontSize: "24px", fontWeight: 500 }}>
                        {formatDuration(activity.duration)}
                    </div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "4px" }}>Elevation Gain</div>
                    <div style={{ fontSize: "24px", fontWeight: 500 }}>
                        {elevationGain}
                    </div>
                </div>

                <div style={{ textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.06)", gridColumn: "1" }}>
                    <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "4px" }}>Max Elevation</div>
                    <div style={{ fontSize: "24px", fontWeight: 500 }}>
                        {maxElevation}
                    </div>
                </div>
            </div>

            <button style={{
                width: "100%",
                padding: "16px",
                background: "var(--primary, #ff4d00)",
                color: "#111",
                border: "none",
                borderRadius: "var(--radius-sm, 8px)",
                fontWeight: 700,
                fontSize: "16px",
                cursor: "pointer",
                marginBottom: "24px",
                transition: "opacity 0.2s"
            }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
               onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                View Analysis
            </button>
        </div>
    );
}
