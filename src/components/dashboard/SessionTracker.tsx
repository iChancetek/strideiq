"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import { useSettings } from "@/context/SettingsContext";
import { useActivities } from "@/hooks/useActivities";
import { AgentCore } from "@/lib/agents/agent-core";
import { GeoPosition, AgentEvent, MileSplit } from "@/lib/agents/types";
import { getActivityLabel, getActivityType, getModeConfig } from "@/lib/agents/mode-agent";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng]);
    }, [lat, lng, map]);
    return null;
}

export default function SessionTracker() {
    const { settings } = useSettings();
    const { addActivity } = useActivities();
    const mode = settings.activityMode;
    const environment = settings.environment;
    const modeConfig = getModeConfig(mode);

    // Session state
    const [isTracking, setIsTracking] = useState(false);
    const [path, setPath] = useState<[number, number][]>([]);
    const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
    const [distance, setDistance] = useState(0); // km
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0); // seconds
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [mileSplits, setMileSplits] = useState<MileSplit[]>([]);
    const [weatherBanner, setWeatherBanner] = useState<string | null>(null);
    const [agentMessages, setAgentMessages] = useState<string[]>([]);

    const watchId = useRef<number | null>(null);
    const lastPos = useRef<[number, number] | null>(null);
    const agentCoreRef = useRef<AgentCore | null>(null);
    const hasAutoStartedRef = useRef(false);

    // Timer — only runs when active AND not paused
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTracking && startTime && !isPaused) {
            interval = setInterval(() => {
                const pausedSec = agentCoreRef.current?.getPausedSeconds() ?? 0;
                const rawElapsed = Math.floor((Date.now() - startTime) / 1000);
                setElapsedTime(rawElapsed - pausedSec);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTracking, startTime, isPaused]);

    // Get initial location
    useEffect(() => {
        if (environment === "indoor") return; // No GPS needed indoors
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setCurrentPos([pos.coords.latitude, pos.coords.longitude]),
                (err) => console.error(err),
                { enableHighAccuracy: true }
            );
        }
    }, [environment]);

    // Agent event handler
    const handleAgentEvent = useCallback((event: AgentEvent) => {
        switch (event.type) {
            case "session:pause":
                setIsPaused(true);
                break;
            case "session:resume":
                setIsPaused(false);
                break;
            case "coaching:mile":
            case "coaching:pr":
            case "coaching:encouragement":
                if (agentCoreRef.current) {
                    setMileSplits(agentCoreRef.current.getMileSplits());
                }
                break;
            case "weather:announcement":
                if (event.message) setWeatherBanner(event.message);
                break;
        }
        // Show all messages briefly in the UI
        if (event.message) {
            setAgentMessages((prev) => [...prev.slice(-2), event.message!]);
            setTimeout(() => {
                setAgentMessages((prev) => prev.slice(1));
            }, 8000);
        }
    }, []);

    const triggerCountdown = () => {
        setCountdown(3);
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev === 1) {
                    clearInterval(timer);
                    startSession();
                    return null;
                }
                return prev ? prev - 1 : null;
            });
        }, 1000);
    };

    const startSession = async () => {
        setIsTracking(true);
        setStartTime(Date.now());
        setPath([]);
        setDistance(0);
        setElapsedTime(0);
        setIsPaused(false);
        setMileSplits([]);
        setWeatherBanner(null);
        setAgentMessages([]);

        // Initialize Agent Core
        const core = new AgentCore({
            mode,
            environment,
            autoPause: settings.autoPause,
            autoPauseSensitivity: settings.autoPauseSensitivity,
            voiceCoaching: settings.voiceCoaching,
            weatherAnnouncements: settings.weatherAnnouncements,
        });
        core.on(handleAgentEvent);
        agentCoreRef.current = core;

        if (environment === "outdoor" && navigator.geolocation) {
            // Start GPS tracking
            watchId.current = navigator.geolocation.watchPosition(
                (pos) => {
                    const { latitude, longitude, speed, accuracy } = pos.coords;
                    const newPos: [number, number] = [latitude, longitude];

                    setCurrentPos(newPos);
                    setPath((prev) => [...prev, newPos]);

                    // Calculate distance
                    if (lastPos.current) {
                        const dist = calculateDistance(
                            lastPos.current[0], lastPos.current[1],
                            latitude, longitude
                        );
                        setDistance((prev) => {
                            const newDist = prev + dist;
                            // Feed agent core
                            const geoPos: GeoPosition = {
                                lat: latitude,
                                lng: longitude,
                                speed,
                                accuracy,
                                timestamp: Date.now(),
                            };
                            core.onPositionUpdate(geoPos, newDist * 0.621371); // km to miles
                            return newDist;
                        });
                    } else {
                        // First position — trigger session start (weather etc)
                        core.onSessionStart(latitude, longitude);
                    }
                    lastPos.current = newPos;
                },
                (err) => console.error(err),
                { enableHighAccuracy: true }
            );
        } else if (environment === "indoor") {
            // Indoor: no GPS, just run the timer
            // Motion could be tracked via DeviceMotion API in future
        }
    };

    const stopSession = async () => {
        setIsTracking(false);
        setIsPaused(false);
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
        lastPos.current = null;

        const core = agentCoreRef.current;
        const pausedSec = core?.getPausedSeconds() ?? 0;
        const splits = core?.getMileSplits() ?? [];
        const weather = core?.getWeather();

        core?.destroy();
        agentCoreRef.current = null;

        // Save activity
        try {
            const miles = distance * 0.621371;
            const minutes = elapsedTime / 60;

            if (miles > 0.05) {
                await addActivity({
                    type: getActivityType(mode),
                    distance: parseFloat(miles.toFixed(2)),
                    duration: parseFloat(minutes.toFixed(2)),
                    calories: Math.round(miles * modeConfig.caloriesPerMile),
                    date: new Date(),
                    notes: `${getActivityLabel(mode)} — ${environment}`,
                    /* Extended fields stored via Firestore merge */
                });
                alert(`${getActivityLabel(mode)} Saved! Distance: ${miles.toFixed(2)} mi`);
            } else {
                alert("Session too short to save.");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to save session.");
        }
    };

    // Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 && h > 0 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const displayMetric = () => {
        const distMiles = distance * 0.621371;
        if (modeConfig.displayMetric === "mph") {
            // Speed in mph
            if (elapsedTime === 0) return "0.0 mph";
            const hours = elapsedTime / 3600;
            return `${(distMiles / hours).toFixed(1)} mph`;
        }
        // Pace in min/mile
        if (distMiles === 0) return "0'00\"/mi";
        const paceSecondsPerMile = elapsedTime / distMiles;
        const pMin = Math.floor(paceSecondsPerMile / 60);
        const pSec = Math.floor(paceSecondsPerMile % 60);
        return `${pMin}'${pSec < 10 ? '0' : ''}${pSec}"/mi`;
    };

    const activityLabel = getActivityLabel(mode);
    const isIndoor = environment === "indoor";

    // Indoor mode — no map needed
    if (isIndoor) {
        return (
            <div style={{ height: "100%", position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--surface)" }}>
                {/* Countdown */}
                {countdown !== null && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                        <div style={{ fontSize: "120px", fontWeight: "bold", color: "var(--primary)", animation: "ping 1s infinite" }}>{countdown}</div>
                    </div>
                )}

                {/* Paused Overlay */}
                {isPaused && isTracking && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 450, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ fontSize: "32px", fontWeight: "bold", color: "var(--warning)", animation: "pulse 2s infinite" }}>⏸ PAUSED</div>
                    </div>
                )}

                {/* Indoor Stats */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px", gap: "30px" }}>
                    <div style={{ fontSize: "14px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "2px" }}>🏠 Indoor {activityLabel}</div>

                    <div style={{ fontSize: "64px", fontWeight: "bold" }}>{formatTime(elapsedTime)}</div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", textAlign: "center" }}>
                        <div>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>DISTANCE</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{(distance * 0.621371).toFixed(2)} <span style={{ fontSize: "14px" }}>mi</span></div>
                        </div>
                        <div>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{modeConfig.displayMetric === "mph" ? "SPEED" : "PACE"}</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{displayMetric()}</div>
                        </div>
                    </div>

                    {/* Mile Splits */}
                    {mileSplits.length > 0 && (
                        <div style={{ width: "100%", maxWidth: "300px" }}>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "8px" }}>MILE SPLITS</div>
                            {mileSplits.map((s) => (
                                <div key={s.mile} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                    <span>Mile {s.mile}</span>
                                    <span style={{ color: "var(--primary)" }}>{formatTime(Math.floor(s.splitSeconds))}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Agent Messages */}
                    {agentMessages.length > 0 && (
                        <div style={{ position: "absolute", bottom: 100, left: 20, right: 20, zIndex: 400 }}>
                            {agentMessages.map((msg, i) => (
                                <div key={i} className="glass-panel" style={{ padding: "10px 16px", borderRadius: "var(--radius-md)", marginBottom: "8px", fontSize: "14px", color: "var(--secondary)", animation: "fadeIn 0.3s ease" }}>
                                    🤖 {msg}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Controls */}
                    <div style={{ position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)", display: "flex", gap: "20px" }}>
                        {!isTracking ? (
                            <button onClick={triggerCountdown} className="btn-primary" style={{ padding: "16px 48px", fontSize: "18px", borderRadius: "var(--radius-full)" }}>
                                START {activityLabel.toUpperCase()}
                            </button>
                        ) : (
                            <button onClick={stopSession} style={{ background: "#ff4444", color: "white", border: "none", padding: "16px 48px", fontSize: "18px", borderRadius: "var(--radius-full)", fontWeight: "bold", cursor: "pointer" }}>
                                STOP
                            </button>
                        )}
                    </div>
                </div>

                <style jsx>{`
                    @keyframes ping { 0% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(0.8); opacity: 0.5; } }
                    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                `}</style>
            </div>
        );
    }

    // Outdoor — waiting for GPS
    if (!currentPos) {
        return <div style={{ color: "white", padding: 20, display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ animation: "pulse 1.5s infinite" }}>📡</span> Locating GPS Satellites...
            <style jsx>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
        </div>;
    }

    return (
        <div style={{ height: "100%", position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {/* Countdown Overlay */}
            {countdown !== null && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                    <div style={{ fontSize: "120px", fontWeight: "bold", color: "var(--primary)", animation: "ping 1s infinite" }}>{countdown}</div>
                </div>
            )}

            {/* Paused Overlay */}
            {isPaused && isTracking && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 450, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ fontSize: "36px", fontWeight: "bold", color: "var(--warning)", animation: "pulse 2s infinite" }}>⏸ PAUSED</div>
                </div>
            )}

            {/* Weather Banner */}
            {weatherBanner && isTracking && (
                <div style={{ position: "absolute", top: 90, left: 20, right: 20, zIndex: 401, padding: "10px 16px", borderRadius: "var(--radius-md)", background: "rgba(0,229,255,0.15)", border: "1px solid rgba(0,229,255,0.3)", fontSize: "13px", color: "var(--secondary)" }}>
                    🌤 {weatherBanner.slice(0, 120)}{weatherBanner.length > 120 ? "..." : ""}
                </div>
            )}

            {/* Stats Overlay */}
            <div className="glass-panel" style={{ position: "absolute", top: 20, left: 20, right: 20, zIndex: 400, padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", textAlign: "center" }}>
                <div>
                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>DISTANCE</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>{(distance * 0.621371).toFixed(2)} <span style={{ fontSize: "14px" }}>mi</span></div>
                </div>
                <div>
                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>TIME</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>{formatTime(elapsedTime)}</div>
                </div>
                <div>
                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{modeConfig.displayMetric === "mph" ? "SPEED" : "PACE"}</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>{displayMetric()}</div>
                </div>
            </div>

            {/* Mile Splits Sidebar */}
            {mileSplits.length > 0 && (
                <div className="glass-panel" style={{ position: "absolute", top: 140, right: 20, zIndex: 400, padding: "12px", borderRadius: "var(--radius-md)", maxHeight: "200px", overflowY: "auto", minWidth: "140px" }}>
                    <div style={{ fontSize: "10px", color: "var(--foreground-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Splits</div>
                    {mileSplits.map((s) => (
                        <div key={s.mile} style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13px", padding: "2px 0" }}>
                            <span style={{ color: "var(--foreground-muted)" }}>Mi {s.mile}</span>
                            <span style={{ color: "var(--primary)", fontWeight: 600 }}>{formatTime(Math.floor(s.splitSeconds))}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Agent Messages Toast */}
            {agentMessages.length > 0 && (
                <div style={{ position: "absolute", bottom: 100, left: 20, right: 20, zIndex: 401 }}>
                    {agentMessages.map((msg, i) => (
                        <div key={i} className="glass-panel" style={{ padding: "10px 16px", borderRadius: "var(--radius-md)", marginBottom: "8px", fontSize: "14px", color: "var(--secondary)", animation: "fadeIn 0.3s ease" }}>
                            🤖 {msg}
                        </div>
                    ))}
                </div>
            )}

            {/* Map */}
            <MapContainer center={currentPos} zoom={16} style={{ height: "100%", width: "100%", zIndex: 0 }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <Marker position={currentPos}>
                    <Popup>You are here</Popup>
                </Marker>
                {path.length > 1 && <Polyline positions={path} color="var(--primary)" weight={5} />}
                <RecenterMap lat={currentPos[0]} lng={currentPos[1]} />
            </MapContainer>

            {/* Controls */}
            <div style={{ position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)", zIndex: 400, display: "flex", gap: "20px" }}>
                {!isTracking ? (
                    <button onClick={triggerCountdown} className="btn-primary" style={{ padding: "16px 48px", fontSize: "18px", borderRadius: "var(--radius-full)" }}>
                        START {activityLabel.toUpperCase()}
                    </button>
                ) : (
                    <button onClick={stopSession} style={{ background: "#ff4444", color: "white", border: "none", padding: "16px 48px", fontSize: "18px", borderRadius: "var(--radius-full)", fontWeight: "bold", cursor: "pointer" }}>
                        STOP
                    </button>
                )}
            </div>

            <style jsx>{`
                @keyframes ping { 0% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(0.8); opacity: 0.5; } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
