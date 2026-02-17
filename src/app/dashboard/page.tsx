import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";

export default function Dashboard() {
    return (
        <DashboardLayout>
            <header style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: "32px" }}>Welcome back, <span className="text-gradient">Runner</span></h1>
                    <p style={{ color: "var(--foreground-muted)" }}>Here's your weekly summary.</p>
                </div>
                <button className="btn-primary">Start Run</button>
            </header>

            {/* Stats Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "20px",
                marginBottom: "40px"
            }}>
                <StatCard title="Weekly Distance" value="12.5" unit="mi" trend="up" trendLabel="15%" />
                <StatCard title="Avg Pace" value="8:45" unit="/mi" trend="down" trendLabel="2%" />
                <StatCard title="Active Calories" value="1,240" unit="kcal" trend="up" trendLabel="8%" />
                <StatCard title="Streak" value="4" unit="days" trend="neutral" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px" }}>
                {/* Main Chart Area Placeholder */}
                <section className="glass-panel" style={{ padding: "30px", borderRadius: "var(--radius-lg)", minHeight: "300px" }}>
                    <h3 style={{ marginBottom: "20px" }}>Activity Overview</h3>
                    <div style={{
                        height: "200px",
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--foreground-muted)"
                    }}>
                        [Chart Placeholder: Weekly Mileage]
                    </div>
                </section>

                {/* Upcoming Training */}
                <section className="glass-panel" style={{ padding: "30px", borderRadius: "var(--radius-lg)" }}>
                    <h3 style={{ marginBottom: "20px" }}>Up Next</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <div style={{ padding: "15px", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)" }}>
                            <div style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600, marginBottom: "4px" }}>TOMORROW • 7:00 AM</div>
                            <div style={{ fontWeight: 600, fontSize: "16px" }}>Interval Speed Run</div>
                            <div style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>45 min • High Intensity</div>
                        </div>
                        <div style={{ padding: "15px", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)" }}>
                            <div style={{ fontSize: "12px", color: "var(--secondary)", fontWeight: 600, marginBottom: "4px" }}>SAT • 8:00 AM</div>
                            <div style={{ fontWeight: 600, fontSize: "16px" }}>Long Run</div>
                            <div style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>10 mi • Steady Pace</div>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
