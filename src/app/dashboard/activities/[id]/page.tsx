"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import ShareButton from "@/components/common/ShareButton";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic import for Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(mod => mod.Polyline), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

export default function ActivityDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [user] = useAuthState(auth);
    const [activity, setActivity] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !id) return;
        fetchActivity();
    }, [user, id]);

    const fetchActivity = async () => {
        try {
            const docRef = doc(db, "users", user!.uid, "activities", id as string);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setActivity({
                    id: docSnap.id,
                    ...data,
                    date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
                });
            } else {
                console.error("Activity not found");
                // router.push("/dashboard/activities");
            }
        } catch (error) {
            console.error("Error fetching activity:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ padding: "40px", textAlign: "center", color: "var(--foreground-muted)" }}>
                    Loading activity details...
                </div>
            </DashboardLayout>
        );
    }

    if (!activity) {
        return (
            <DashboardLayout>
                <div style={{ padding: "40px", textAlign: "center" }}>
                    <h2>Activity not found</h2>
                    <Link href="/dashboard/activities" style={{ color: "var(--primary)", marginTop: "10px", display: "inline-block" }}>
                        &larr; Back to Activities
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    // Prepare map data if available (mocking path if not stored yet)
    // In a real app, 'path' would be stored in the activity document or a subcollection.
    // For this prototype, if it was a GPS run, we might simulate or just center the map.
    // Let's check for 'path' or just show a static placeholder map if missing.
    const hasMapData = activity.path && activity.path.length > 0;
    const center = hasMapData ? activity.path[0] : [37.7749, -122.4194]; // Default SF or user loc

    const shareText = `Check out my ${activity.distance} mile ${activity.type} on StrideIQ! Time: ${activity.duration}m, Pace: ${activity.pace}/mi.`;

    return (
        <DashboardLayout>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <header style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        <button
                            onClick={() => router.back()}
                            style={{
                                background: "none", border: "none", color: "var(--foreground-muted)",
                                fontSize: "24px", cursor: "pointer", padding: "0 10px 0 0"
                            }}
                        >
                            &larr;
                        </button>
                        <div>
                            <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>{activity.type} on {activity.date.toLocaleDateString()}</h1>
                            <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                                {activity.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                    <ShareButton title={`StrideIQ Activity`} text={shareText} />
                </header>

                <div className="grid gap-6">
                    {/* Map Section */}
                    <div className="glass-panel" style={{ height: "300px", borderRadius: "var(--radius-lg)", overflow: "hidden", position: "relative" }}>
                        {/* 
                            Note: Leaflet requires window, so it's dyn imported.
                            Also need 'leaflet.css' which is global or imported here.
                        */}
                        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                            />
                            {hasMapData ? (
                                <>
                                    <Polyline positions={activity.path} color="var(--primary)" weight={4} />
                                    <Marker position={activity.path[0]}>
                                        <Popup>Start</Popup>
                                    </Marker>
                                    <Marker position={activity.path[activity.path.length - 1]}>
                                        <Popup>Finish</Popup>
                                    </Marker>
                                </>
                            ) : (
                                <div style={{
                                    position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                                    background: "rgba(0,0,0,0.5)", color: "white", zIndex: 1000
                                }}>
                                    Map data not available for this activity.
                                </div>
                            )}
                        </MapContainer>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="glass-panel" style={{ padding: "20px", textAlign: "center", borderRadius: "var(--radius-md)" }}>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "5px" }}>DISTANCE</div>
                            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{activity.distance}</div>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>miles</div>
                        </div>
                        <div className="glass-panel" style={{ padding: "20px", textAlign: "center", borderRadius: "var(--radius-md)" }}>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "5px" }}>DURATION</div>
                            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{activity.duration}</div>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>min</div>
                        </div>
                        <div className="glass-panel" style={{ padding: "20px", textAlign: "center", borderRadius: "var(--radius-md)" }}>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "5px" }}>AVG PACE</div>
                            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{activity.pace}</div>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>/mi</div>
                        </div>
                        <div className="glass-panel" style={{ padding: "20px", textAlign: "center", borderRadius: "var(--radius-md)" }}>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "5px" }}>CALORIES</div>
                            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{activity.calories || "-"}</div>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>kcal</div>
                        </div>
                    </div>

                    {/* Splits / Notes */}
                    <div className="glass-panel" style={{ padding: "20px", borderRadius: "var(--radius-lg)" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px" }}>Notes</h3>
                        <p style={{ color: "var(--foreground-muted)", lineHeight: "1.6" }}>
                            {activity.notes || "No notes added for this run."}
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
