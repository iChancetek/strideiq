"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AchievementBadge from "@/components/dashboard/AchievementBadge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/lib/api-client";
import { ChevronRight } from "lucide-react";

export default function AchievementsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await authenticatedFetch("/api/achievements");
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (e) {
                console.error("Error fetching achievements:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ padding: "40px", textAlign: "center", color: "var(--foreground-muted)" }}>
                    Loading Achievements...
                </div>
            </DashboardLayout>
        );
    }

    const { pbs, totals, streakCount, monthlyMiles } = data || {};

    const formatTime = (seconds?: number) => {
        if (!seconds) return "--:--";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "60px" }}>
                {/* Header */}
                <header style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px" }}>
                    <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "var(--foreground)", fontSize: "24px", cursor: "pointer" }}>←</button>
                    <h1 style={{ fontSize: "24px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px" }}>Achievements</h1>
                </header>

                {/* Levels Hook */}
                <section style={{ marginBottom: "40px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {["Run", "Walk", "Bike", "Hike"].map(cat => {
                            const miles = totals?.[cat] || 0;
                            // Level logic (Nike style)
                            let level = "Yellow";
                            let variant: any = "yellow";
                            if (miles > 3105) { level = "Purple"; variant = "purple"; }
                            else if (miles > 1552) { level = "Blue"; variant = "blue"; }
                            else if (miles > 621) { level = "Green"; variant = "green"; }
                            else if (miles > 155) { level = "Orange"; variant = "orange"; }

                            return (
                                <Link key={cat} href={`/dashboard/achievements/levels?type=${cat}`} style={{ 
                                    textDecoration: "none", 
                                    background: "rgba(255,255,255,0.03)", 
                                    padding: "20px",
                                    borderRadius: "16px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    border: "1px solid rgba(255,255,255,0.05)"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        <div style={{ width: "40px", height: "45px" }}>
                                            <AchievementBadge type="level" variant={variant} label="" count={cat === "Run" ? "RUN" : cat[0]} />
                                        </div>
                                        <div>
                                          <div style={{ fontWeight: 800, fontSize: "18px" }}>{cat} Levels</div>
                                          <div style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>{miles.toFixed(2)} Total Miles</div>
                                        </div>
                                    </div>
                                    <ChevronRight color="var(--foreground-muted)" />
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* Personal Bests */}
                <section style={{ marginBottom: "50px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: 900, marginBottom: "20px", textTransform: "uppercase" }}>Personal Bests</h2>
                    <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", 
                        gap: "20px" 
                    }}>
                        <AchievementBadge type="personal_best" variant={pbs?.fastest_1mi ? "volt" : "locked"} label="Fastest 1 Mi" sublabel={formatTime(pbs?.fastest_1mi?.duration)} count="1MI" locked={!pbs?.fastest_1mi} />
                        <AchievementBadge type="personal_best" variant={pbs?.fastest_5k ? "volt" : "locked"} label="Fastest 5K" sublabel={formatTime(pbs?.fastest_5k?.duration)} count="5K" locked={!pbs?.fastest_5k} />
                        <AchievementBadge type="personal_best" variant={pbs?.fastest_10k ? "volt" : "locked"} label="Fastest 10K" sublabel={formatTime(pbs?.fastest_10k?.duration)} count="10K" locked={!pbs?.fastest_10k} />
                        <AchievementBadge type="personal_best" variant={pbs?.fastest_half_marathon ? "volt" : "locked"} label="Fastest Half" sublabel={formatTime(pbs?.fastest_half_marathon?.duration)} count="13.1" locked={!pbs?.fastest_half_marathon} />
                        <AchievementBadge type="personal_best" variant={pbs?.fastest_marathon ? "volt" : "locked"} label="Fastest Full" sublabel={formatTime(pbs?.fastest_marathon?.duration)} count="26.2" locked={!pbs?.fastest_marathon} />
                        <AchievementBadge type="personal_best" variant={pbs?.farthest_run > 0 ? "volt" : "locked"} label="Farthest Run" sublabel={`${pbs?.farthest_run?.toFixed(2)} mi`} count="MAX" locked={pbs?.farthest_run === 0} />
                    </div>
                </section>

                {/* Streaks */}
                <section style={{ marginBottom: "50px" }}>
                   <h2 style={{ fontSize: "18px", fontWeight: 900, marginBottom: "20px", textTransform: "uppercase" }}>Streaks</h2>
                   <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", 
                        gap: "20px" 
                    }}>
                        <AchievementBadge type="streak" variant={streakCount >= 7 ? "volt" : "locked"} label="7 Day Streak" count="7" locked={streakCount < 7} />
                        <AchievementBadge type="streak" variant={streakCount >= 30 ? "volt" : "locked"} label="30 Day Streak" count="30" locked={streakCount < 30} />
                        <AchievementBadge type="streak" variant={streakCount >= 100 ? "volt" : "locked"} label="100 Day Streak" count="100" locked={streakCount < 100} />
                        <AchievementBadge type="streak" variant={streakCount >= 365 ? "volt" : "locked"} label="1 Year Streak" count="365" locked={streakCount < 365} />
                    </div>
                </section>

                 {/* Monthly Miles */}
                 <section>
                    <h2 style={{ fontSize: "18px", fontWeight: 900, marginBottom: "20px", textTransform: "uppercase" }}>Monthly Milestones</h2>
                    <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", 
                        gap: "20px" 
                    }}>
                        {/* Current month check for fun */}
                        <AchievementBadge type="milestone" variant="bronze" label="Bronze Month" sublabel="15+ Miles" count="15" />
                        <AchievementBadge type="milestone" variant="silver" label="Silver Month" sublabel="25+ Miles" count="25" />
                        <AchievementBadge type="milestone" variant="gold" label="Gold Month" sublabel="50+ Miles" count="50" />
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
