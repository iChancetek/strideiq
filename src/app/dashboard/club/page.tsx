"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { authenticatedFetch } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { Plus, ChevronRight, Users } from "lucide-react";

export default function ClubPage() {
    const [challenges, setChallenges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newType, setNewType] = useState("Run");
    const [newGoal, setNewGoal] = useState("10");
    const [newDuration, setNewDuration] = useState("week");
    const router = useRouter();

    const fetchChallenges = async () => {
        try {
            const res = await authenticatedFetch("/api/challenges");
            if (res.ok) {
                const data = await res.json();
                setChallenges(data.challenges || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChallenges();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await authenticatedFetch("/api/challenges", {
                method: "POST",
                body: JSON.stringify({
                    title: newTitle,
                    type: newType,
                    goal: newGoal,
                    duration: newDuration
                })
            });
            if (res.ok) {
                setIsCreating(false);
                setNewTitle("");
                fetchChallenges();
            }
        } catch (e) {
            alert("Failed to create challenge");
        }
    };

    const handleJoin = async (id: string) => {
        try {
            const res = await authenticatedFetch("/api/challenges", {
                method: "PUT",
                body: JSON.stringify({ challengeId: id })
            });
            if (res.ok) fetchChallenges();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "80px" }}>
                {/* Header Section */}
                <header style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h1 style={{ fontSize: "32px", fontWeight: 900, textTransform: "uppercase" }}>Club</h1>
                    <div style={{ display: "flex", gap: "20px" }}>
                        <span style={{ fontWeight: 700, borderBottom: "2px solid var(--foreground)", paddingBottom: "4px" }}>Challenges</span>
                        <span style={{ color: "var(--foreground-muted)", fontWeight: 700 }}>Leaderboard</span>
                    </div>
                </header>

                <button 
                  onClick={() => setIsCreating(true)}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "32px",
                    background: "var(--foreground)",
                    color: "var(--background)",
                    fontWeight: 700,
                    fontSize: "16px",
                    border: "none",
                    cursor: "pointer",
                    marginBottom: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                    <Plus size={20} /> Create a Challenge
                </button>

                {/* Challenge Creation Modal (Overlay) */}
                {isCreating && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                        <form onSubmit={handleCreate} className="glass-panel" style={{ width: "100%", maxWidth: "400px", padding: "30px", borderRadius: "24px" }}>
                            <h2 style={{ marginBottom: "20px", fontWeight: 900 }}>Create Challenge</h2>
                            <input 
                              type="text" 
                              placeholder="Challenge Title" 
                              value={newTitle} 
                              onChange={e => setNewTitle(e.target.value)}
                              required
                              style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", marginBottom: "15px", borderRadius: "8px" }}
                            />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px" }}>
                                <select value={newType} onChange={e => setNewType(e.target.value)} style={{ padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "8px" }}>
                                    <option value="Run">Run</option>
                                    <option value="Walk">Walk</option>
                                    <option value="Bike">Bike</option>
                                    <option value="Hike">Hike</option>
                                </select>
                                <select value={newDuration} onChange={e => setNewDuration(e.target.value)} style={{ padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "8px" }}>
                                    <option value="week">Weekly</option>
                                    <option value="month">Monthly</option>
                                </select>
                            </div>
                            <input 
                              type="number" 
                              placeholder="Distance Goal (miles)" 
                              value={newGoal} 
                              onChange={e => setNewGoal(e.target.value)}
                              required
                              style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", marginBottom: "25px", borderRadius: "8px" }}
                            />
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Create</button>
                                <button type="button" onClick={() => setIsCreating(false)} style={{ flex: 1, background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "8px" }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Join Section */}
                <section>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h2 style={{ fontSize: "18px", fontWeight: 900 }}>Join a Challenge</h2>
                        <span style={{ color: "var(--foreground-muted)", fontSize: "13px" }}>View all</span>
                    </div>

                    {loading ? (
                        <p style={{ color: "var(--foreground-muted)" }}>Loading challenges...</p>
                    ) : challenges.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                            No active challenges found. Create the first one!
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {challenges.map(c => {
                                const daysLeft = Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000 * 3600 * 24));
                                
                                return (
                                    <div key={c.id} style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "16px",
                                        background: "rgba(255,255,255,0.03)",
                                        borderRadius: "16px",
                                        border: "1px solid rgba(255,255,255,0.05)"
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                            <div style={{ width: "48px", height: "48px", background: "var(--primary-low-opacity)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                                                <Users size={24} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: "16px" }}>{c.title}</div>
                                                <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                                                    {c.type} {c.goal} miles this {c.duration}.
                                                </div>
                                                <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "2px" }}>
                                                    {daysLeft} days left · {(c.participants || []).length} joined
                                                </div>
                                            </div>
                                        </div>
                                        {c.isJoined ? (
                                            <div style={{ color: "var(--success)", fontWeight: 800, fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
                                                JOINED <ChevronRight size={16} />
                                            </div>
                                        ) : (
                                            <button 
                                              onClick={() => handleJoin(c.id)}
                                              style={{ background: "var(--primary)", color: "#000", border: "none", padding: "8px 16px", borderRadius: "20px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                                            >
                                                JOIN
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}
