"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/config";

// Types
interface Friend {
    uid: string;
    displayName: string;
    photoURL?: string;
}

interface PendingRequest {
    id: string;
    requester: Friend;
}

export default function FriendsPage() {
    const [user] = useAuthState(auth);
    const [activeTab, setActiveTab] = useState<"my-friends" | "find" | "requests">("my-friends");

    // Data States
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<PendingRequest[]>([]);
    const [searchResults, setSearchResults] = useState<Friend[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    // Fetch Data
    useEffect(() => {
        if (!user) return;
        fetchFriends();
        fetchRequests();
    }, [user, activeTab]);

    const fetchFriends = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/friends/list?userId=${user.uid}`);
            const data = await res.json();
            setFriends(data.friends || []);
        } catch (error) {
            console.error("Failed to fetch friends", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/friends/pending?userId=${user.uid}`);
            const data = await res.json();
            setRequests(data.requests || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim() || !user) return;
        setLoading(true);
        setStatusMessage("");
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}&userId=${user.uid}`);
            const data = await res.json();
            setSearchResults(data.users || []);
            if (data.users?.length === 0) setStatusMessage("No users found.");
        } catch (error) {
            console.error(error);
            setStatusMessage("Search failed.");
        } finally {
            setLoading(false);
        }
    };

    const sendRequest = async (targetId: string) => {
        if (!user) return;
        try {
            const res = await fetch("/api/friends/request", {
                method: "POST",
                body: JSON.stringify({ userId: user.uid, targetUserId: targetId })
            });
            const data = await res.json();
            if (data.success) {
                alert("Friend request sent!");
                // Remove from search results to prevent double send
                setSearchResults(prev => prev.filter(u => u.uid !== targetId));
            } else {
                alert(data.error || "Failed to send request");
            }
        } catch (error) {
            console.error(error);
            alert("Error sending request");
        }
    };

    const acceptRequest = async (requestId: string) => {
        if (!user) return;
        try {
            const res = await fetch("/api/friends/accept", {
                method: "POST",
                body: JSON.stringify({ userId: user.uid, requestId })
            });
            const data = await res.json();
            if (data.success) {
                // Refresh lists
                setRequests(prev => prev.filter(r => r.id !== requestId));
                fetchFriends();
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
                <header style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h1 style={{ fontSize: "32px", fontWeight: "bold" }}>Friends</h1>
                    <div className="tab-group" style={{ display: "flex", gap: "10px", background: "var(--background-secondary)", padding: "5px", borderRadius: "var(--radius-full)" }}>
                        <button
                            onClick={() => setActiveTab("my-friends")}
                            style={{
                                padding: "8px 20px",
                                borderRadius: "var(--radius-full)",
                                background: activeTab === "my-friends" ? "var(--primary)" : "transparent",
                                color: activeTab === "my-friends" ? "var(--background)" : "var(--foreground)",
                                border: "none", cursor: "pointer", fontWeight: "bold"
                            }}>My Friends ({friends.length})</button>
                        <button
                            onClick={() => setActiveTab("requests")}
                            style={{
                                padding: "8px 20px",
                                borderRadius: "var(--radius-full)",
                                background: activeTab === "requests" ? "var(--primary)" : "transparent",
                                color: activeTab === "requests" ? "var(--background)" : "var(--foreground)",
                                border: "none", cursor: "pointer", fontWeight: "bold"
                            }}>Requests ({requests.length})</button>
                        <button
                            onClick={() => setActiveTab("find")}
                            style={{
                                padding: "8px 20px",
                                borderRadius: "var(--radius-full)",
                                background: activeTab === "find" ? "var(--primary)" : "transparent",
                                color: activeTab === "find" ? "var(--background)" : "var(--foreground)",
                                border: "none", cursor: "pointer", fontWeight: "bold"
                            }}>Find Friends</button>
                    </div>
                </header>

                {activeTab === "my-friends" && (
                    <div className="grid grid-cols-1 gap-4">
                        {friends.map(friend => (
                            <div key={friend.uid} className="glass-panel" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "20px", borderRadius: "var(--radius-md)" }}>
                                <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#333", overflow: "hidden" }}>
                                    {friend.photoURL && <img src={friend.photoURL} alt={friend.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: "bold", fontSize: "18px" }}>{friend.displayName}</h3>
                                    <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>Runner</p>
                                </div>
                            </div>
                        ))}
                        {friends.length === 0 && !loading && (
                            <div style={{ textAlign: "center", padding: "40px", color: "var(--foreground-muted)" }}>
                                No friends yet. Go to "Find Friends" to connect!
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "requests" && (
                    <div className="grid grid-cols-1 gap-4">
                        {requests.map(req => (
                            <div key={req.id} className="glass-panel" style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "var(--radius-md)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                                    <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#333", overflow: "hidden" }}>
                                        {req.requester.photoURL && <img src={req.requester.photoURL} alt={req.requester.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: "bold", fontSize: "18px" }}>{req.requester.displayName}</h3>
                                        <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>Wants to be friends</p>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button onClick={() => acceptRequest(req.id)} className="btn-primary" style={{ padding: "8px 20px", borderRadius: "var(--radius-full)" }}>Accept</button>
                                </div>
                            </div>
                        ))}
                        {requests.length === 0 && (
                            <div style={{ textAlign: "center", padding: "40px", color: "var(--foreground-muted)" }}>
                                No pending requests.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "find" && (
                    <div>
                        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: "15px",
                                    borderRadius: "var(--radius-full)",
                                    border: "1px solid var(--gray-800)",
                                    background: "rgba(255,255,255,0.05)",
                                    color: "white"
                                }}
                            />
                            <button type="submit" className="btn-primary" disabled={loading}>Search</button>
                        </form>

                        {statusMessage && <p style={{ textAlign: "center", marginBottom: "20px" }}>{statusMessage}</p>}

                        <div className="grid grid-cols-1 gap-4">
                            {searchResults.map(user => (
                                <div key={user.uid} className="glass-panel" style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "var(--radius-md)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                                        <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#333", overflow: "hidden" }}>
                                            {user.photoURL && <img src={user.photoURL} alt={user.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                        </div>
                                        <h3 style={{ fontWeight: "bold", fontSize: "18px" }}>{user.displayName}</h3>
                                    </div>
                                    <button onClick={() => sendRequest(user.uid)} style={{ padding: "8px 20px", borderRadius: "var(--radius-full)", background: "rgba(255,255,255,0.1)", border: "none", color: "white", cursor: "pointer" }}>Add Friend</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
