"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AchievementBadge from "@/components/dashboard/AchievementBadge";
import { authenticatedFetch } from "@/lib/api-client";

function LevelsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const type = searchParams.get("type") || "Run";
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await authenticatedFetch("/api/achievements");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div style={{ padding: "100px", textAlign: "center" }}>Loading Levels...</div>;

    const miles = stats?.totals?.[type] || 0;

    const levels = [
        { label: "Yellow", range: "0 - 31.05 Miles", min: 0, variant: "yellow" },
        { label: "Orange", range: "31.06 - 155.2 Miles", min: 31.06, variant: "orange" },
        { label: "Green", range: "155.3 - 621.2 Miles", min: 155.3, variant: "green" },
        { label: "Blue", range: "621.3 - 1,552 Miles", min: 621.3, variant: "blue" },
        { label: "Purple", range: "1,553 - 3,105 Miles", min: 1553, variant: "purple" },
        { label: "Black", range: "3,106 - 9,320 Miles", min: 3106, variant: "black" },
        { label: "Volt", range: "9,321+ Miles", min: 9321, variant: "volt" },
    ];

    const currentLevel = [...levels].reverse().find(l => miles >= l.min) || levels[0];

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center", paddingBottom: "60px" }}>
                {/* Header */}
                <header style={{ display: "flex", alignItems: "center", marginBottom: "40px" }}>
                    <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "var(--foreground)", fontSize: "24px", cursor: "pointer" }}>←</button>
                    <h1 style={{ flex: 1, fontSize: "18px", fontWeight: 900, textTransform: "uppercase" }}>{type} Levels</h1>
                </header>

                {/* Hero */}
                <div style={{ marginBottom: "60px" }}>
                    <div style={{ width: "120px", margin: "0 auto 30px" }}>
                        <AchievementBadge type="level" size="lg" variant={currentLevel.variant as any} label="" count={type === "Run" ? "RUN" : type[0]} />
                    </div>
                    <p style={{ fontSize: "16px", fontWeight: 600 }}>Keep it up! Every mile counts!</p>
                </div>

                {/* Levels List */}
                <div style={{ textAlign: "left", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    {levels.map(l => (
                        <div key={l.label} style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "20px", 
                            padding: "24px 0", 
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            opacity: miles >= l.min ? 1 : 0.3
                        }}>
                            <div style={{ width: "50px" }}>
                                <AchievementBadge type="level" size="sm" variant={l.variant as any} label="" count={type === "Run" ? "RUN" : type[0]} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: "18px" }}>{l.label}</div>
                                <div style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>{l.range}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function LevelsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LevelsContent />
        </Suspense>
    );
}
