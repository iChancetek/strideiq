export default function StatCard({
    title,
    value,
    unit,
    trend,
    trendLabel
}: {
    title: string;
    value: string | number;
    unit?: string;
    trend?: "up" | "down" | "neutral";
    trendLabel?: string;
}) {
    const trendColor = trend === "up" ? "var(--success)" : trend === "down" ? "var(--error)" : "var(--foreground-muted)";

    return (
        <div className="glass-panel" style={{
            padding: "24px",
            borderRadius: "var(--radius-md)",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
        }}>
            <h3 style={{ fontSize: "14px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {title}
            </h3>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "32px", fontWeight: 700, fontFamily: "var(--font-heading)" }}>{value}</span>
                {unit && <span style={{ fontSize: "16px", color: "var(--foreground-muted)" }}>{unit}</span>}
            </div>
            {trendLabel && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                    <span style={{ color: trendColor, fontWeight: 600 }}>
                        {trend === "up" ? "↑" : "↓"} {trendLabel}
                    </span>
                    <span style={{ color: "var(--foreground-muted)" }}>vs last week</span>
                </div>
            )}
        </div>
    );
}
