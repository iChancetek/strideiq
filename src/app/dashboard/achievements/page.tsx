"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import BadgesSection from "@/components/dashboard/BadgesSection";
import PersonalRecords from "@/components/dashboard/PersonalRecords";

export default function AchievementsPage() {
    const { user } = useAuth();
    const [userStats, setUserStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const fetchStats = async () => {
                try {
                    const statsRef = doc(db, "users", user.uid, "stats", "allTime");
                    const snap = await getDoc(statsRef);
                    if (snap.exists()) {
                        setUserStats(snap.data());
                    }
                } catch (e) {
                    console.error("Error fetching stats:", e);
                } finally {
                    setLoading(false);
                }
            };
            fetchStats();
        }
    }, [user]);

    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Achievements</h1>
                <p className="text-foreground-muted">Track your progress, earn badges, and break personal records.</p>
            </header>

            {loading ? (
                <div className="grid gap-6">
                    <div className="glass-panel h-64 animate-pulse" />
                    <div className="glass-panel h-64 animate-pulse" />
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Badges Section */}
                    <div className="glass-panel p-6">
                        <BadgesSection badges={userStats?.badges} />
                    </div>

                    {/* Personal Records Section */}
                    <div className="glass-panel p-6">
                        <PersonalRecords records={userStats?.records} />
                    </div>
                </div>
            )}
        </div>
    );
}
