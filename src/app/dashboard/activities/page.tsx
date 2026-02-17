"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import LogActivityForm from "@/components/dashboard/LogActivityForm";
import { useActivities } from "@/hooks/useActivities";

export default function ActivitiesPage() {
    const { activities, loading } = useActivities();

    return (
        <DashboardLayout>
            <header style={{ marginBottom: "30px" }}>
                <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>Activities</h1>
                <p style={{ color: "var(--foreground-muted)" }}>Track your progress and log new sessions.</p>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "30px" }}>
                {/* Activity List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {loading ? (
                        <div style={{ color: "var(--foreground-muted)" }}>Loading activities...</div>
                    ) : activities.length === 0 ? (
                        <div className="glass-panel" style={{ padding: "40px", textAlign: "center", borderRadius: "var(--radius-lg)" }}>
                            <p style={{ color: "var(--foreground-muted)", marginBottom: "20px" }}>No activities found. Log your first run!</p>
                        </div>
                    ) : (
                        activities.map((activity) => (
                            <div key={activity.id} className="glass-panel" style={{ padding: "20px", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                                        <span style={{
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            padding: "4px 8px",
                                            borderRadius: "var(--radius-full)",
                                            background: activity.type === "Run" ? "rgba(0, 229, 255, 0.1)" : "rgba(204, 255, 0, 0.1)",
                                            color: activity.type === "Run" ? "var(--primary)" : "var(--secondary)"
                                        }}>
                                            {activity.type.toUpperCase()}
                                        </span>
                                        <span style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                                            {activity.date.toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: "18px" }}>{activity.distance} mi <span style={{ color: "var(--foreground-muted)", fontWeight: 400 }}>in</span> {activity.duration} min</div>
                                    {activity.notes && <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginTop: "5px" }}>"{activity.notes}"</p>}
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "20px", fontWeight: 700, fontFamily: "var(--font-heading)" }}>{activity.pace}</div>
                                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>/mi</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Sidebar Form */}
                <div>
                    <LogActivityForm />
                </div>
            </div>
        </DashboardLayout>
    );
}
