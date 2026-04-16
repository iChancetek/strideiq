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

                {/* Run Level Hero Card (Image 4 Style) */}
                <section style={{ marginBottom: "40px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: 900, marginBottom: "15px", textTransform: "uppercase" }}>Run Level</h2>
                    {(() => {
                        const runMiles = totals?.Run || 0;
                        const levelsArr = [
                            { min: 0, variant: "yellow", label: "Yellow" },
                            { min: 31, variant: "orange", label: "Orange" },
                            { min: 155, variant: "green", label: "Green" },
                            { min: 621, variant: "blue", label: "Blue" },
                            { min: 1553, variant: "purple", label: "Purple" },
                            { min: 3106, variant: "black", label: "Black" },
                            { min: 9321, variant: "volt", label: "Volt" }
                        ];
                        const current = [...levelsArr].reverse().find(l => runMiles >= l.min) || levelsArr[0];
                        
                        const getLevelColor = (v: string) => {
                            switch(v) {
                                case 'yellow': return '#FFE600';
                                case 'orange': return '#FF6B00';
                                case 'green': return '#00E676';
                                case 'blue': return '#00B0FF';
                                case 'purple': return '#D500F9';
                                case 'black': return '#212121';
                                case 'volt': return '#C6FF00';
                                default: return '#FFE600';
                            }
                        };

                        const cardBg = current.variant === 'volt' ? '#C6FF00' : 'rgba(255,255,255,0.03)';
                        const textColor = current.variant === 'volt' ? '#000' : '#fff';

                        return (
                            <div style={{ 
                                background: cardBg, 
                                borderRadius: "24px", 
                                padding: "30px", 
                                color: textColor,
                                position: "relative",
                                overflow: "hidden",
                                border: current.variant === 'volt' ? "none" : "1px solid rgba(255,255,255,0.05)"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: "16px", marginBottom: "8px" }}>{current.label}</div>
                                        <div style={{ fontSize: "56px", fontWeight: 900, fontStyle: "italic", lineHeight: 0.9 }}>
                                            {runMiles.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </div>
                                        <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "8px", opacity: 0.8 }}>Total Miles</div>
                                    </div>
                                    <div style={{ width: "60px", height: "70px" }}>
                                        <AchievementBadge type="level" variant={current.variant as any} label="" count="RUN" />
                                    </div>
                                </div>

                                {/* Spectrum Progress Bar */}
                                <div style={{ marginTop: "25px" }}>
                                    <div style={{ display: "flex", gap: "4px", height: "6px" }}>
                                        {levelsArr.map((l, idx) => {
                                            const isAchieved = runMiles >= l.min;
                                            return (
                                                <div key={l.variant} style={{ 
                                                    flex: 1, 
                                                    background: isAchieved ? getLevelColor(l.variant) : 'rgba(255,255,255,0.1)',
                                                    borderRadius: "3px" 
                                                }} />
                                            );
                                        })}
                                    </div>
                                    <p style={{ fontSize: "13px", fontWeight: 600, marginTop: "15px", opacity: 0.8 }}>
                                        Keep it up! Every mile counts!
                                    </p>
                                </div>
                                <button 
                                    onClick={() => router.push('/dashboard/achievements/levels?type=Run')}
                                    style={{ 
                                        width: "100%", 
                                        marginTop: "20px",
                                        padding: "16px",
                                        background: current.variant === 'volt' ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
                                        border: "none",
                                        borderRadius: "12px",
                                        color: textColor,
                                        fontWeight: 800,
                                        cursor: "pointer",
                                        fontSize: "14px"
                                    }}
                                >
                                    View Run Levels
                                </button>
                            </div>
                        );
                    })()}
                </section>

                <section style={{ marginBottom: "40px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: 900, marginBottom: "20px", textTransform: "uppercase" }}>Other Levels</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {["Walk", "Bike", "Hike"].map(cat => {
                             const miles = totals?.[cat] || 0;
                             let variant: any = "yellow";
                             if (miles >= 9321) variant = "volt";
                             else if (miles >= 3106) variant = "black";
                             else if (miles >= 1553) variant = "purple";
                             else if (miles >= 621) variant = "blue";
                             else if (miles >= 155) variant = "green";
                             else if (miles >= 31) variant = "orange";
                             
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
                                        <div style={{ width: "40px", height: "48px" }}>
                                            <AchievementBadge type="level" size="sm" variant={variant} label="" count={cat[0]} />
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
                        <AchievementBadge type="personal_best" variant={pbs?.fastest_1mi ? "yellow" : "locked"} label="Fastest 1 Mi" sublabel={formatTime(pbs?.fastest_1mi?.duration)} count="1MI" locked={!pbs?.fastest_1mi} />
                        <AchievementBadge type="personal_best" variant={pbs?.fastest_5k ? "orange" : "locked"} label="Fastest 5K" sublabel={formatTime(pbs?.fastest_5k?.duration)} count="5K" locked={!pbs?.fastest_5k} />
                        <AchievementBadge type="personal_best" variant={pbs?.fastest_10k ? "green" : "locked"} label="Fastest 10K" sublabel={formatTime(pbs?.fastest_10k?.duration)} count="10K" locked={!pbs?.fastest_10k} />
                        <AchievementBadge type="personal_best" variant={pbs?.max_steps ? "volt" : "locked"} label="Most Steps" sublabel={pbs?.max_steps?.display} count="STEP" locked={!pbs?.max_steps} />
                        <AchievementBadge type="personal_best" variant={pbs?.fastest_half_marathon ? "blue" : "locked"} label="Fastest Half" sublabel={formatTime(pbs?.fastest_half_marathon?.duration)} count="13.1" locked={!pbs?.fastest_half_marathon} />
                        <AchievementBadge type="personal_best" variant={pbs?.fastest_marathon ? "purple" : "locked"} label="Fastest Full" sublabel={formatTime(pbs?.fastest_marathon?.duration)} count="26.2" locked={!pbs?.fastest_marathon} />
                        <AchievementBadge type="personal_best" variant={pbs?.farthest_run > 0 ? "volt" : "locked"} label="Farthest Run" sublabel={`${pbs?.farthest_run?.toFixed(2)} mi`} count="MAX" locked={pbs?.farthest_run === 0} />
                    </div>
                </section>

                {/* Step Milestones */}
                <section style={{ marginBottom: "50px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "20px" }}>
                        <h2 style={{ fontSize: "18px", fontWeight: 900, margin: 0, textTransform: "uppercase" }}>Step milestones</h2>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--primary)" }}>{data?.allTimeSteps?.toLocaleString()} Total Steps</span>
                    </div>
                    <div style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", 
                        gap: "20px" 
                    }}>
                        <AchievementBadge type="milestone" variant={data?.allTimeSteps >= 100000 ? "bronze" : "locked"} label="100k Steps" sublabel="Bronze" count="100K" locked={data?.allTimeSteps < 100000} />
                        <AchievementBadge type="milestone" variant={data?.allTimeSteps >= 250000 ? "silver" : "locked"} label="250k Steps" sublabel="Silver" count="250K" locked={data?.allTimeSteps < 250000} />
                        <AchievementBadge type="milestone" variant={data?.allTimeSteps >= 500000 ? "gold" : "locked"} label="500k Steps" sublabel="Gold" count="500K" locked={data?.allTimeSteps < 500000} />
                        <AchievementBadge type="milestone" variant={data?.allTimeSteps >= 1000000 ? "volt" : "locked"} label="1M Steps" sublabel="Diamond" count="1M" locked={data?.allTimeSteps < 1000000} />
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
                        <AchievementBadge type="streak" variant={streakCount >= 7 ? "orange" : "locked"} label="7 Day Streak" count="7" locked={streakCount < 7} />
                        <AchievementBadge type="streak" variant={streakCount >= 30 ? "green" : "locked"} label="30 Day Streak" count="30" locked={streakCount < 30} />
                        <AchievementBadge type="streak" variant={streakCount >= 100 ? "blue" : "locked"} label="100 Day Streak" count="100" locked={streakCount < 100} />
                        <AchievementBadge type="streak" variant={streakCount >= 365 ? "purple" : "locked"} label="1 Year Streak" count="365" locked={streakCount < 365} />
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
                        <AchievementBadge type="milestone" variant={data?.currentMonthMiles >= 15 ? "bronze" : "locked"} label="Bronze Month" sublabel="15+ Miles" count="15" locked={data?.currentMonthMiles < 15} />
                        <AchievementBadge type="milestone" variant={data?.currentMonthMiles >= 25 ? "silver" : "locked"} label="Silver Month" sublabel="25+ Miles" count="25" locked={data?.currentMonthMiles < 25} />
                        <AchievementBadge type="milestone" variant={data?.currentMonthMiles >= 50 ? "gold" : "locked"} label="Gold Month" sublabel="50+ Miles" count="50" locked={data?.currentMonthMiles < 50} />
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
