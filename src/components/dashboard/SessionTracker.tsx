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

// ─── GPS Constants (Nike/Strava standard thresholds) ─────────────────────────
const GPS_ACCURACY_THRESHOLD = 20;    // metres — reject readings worse than this
const MIN_DISTANCE_THRESHOLD = 0.003; // km (~3 m) — ignore micro-jitter
const MAX_SPEED_KMH = 72;            // ~45 mph — reject teleportation glitches
const SMOOTHING_FACTOR = 0.35;        // exponential moving average weight for new readings

// ─── Step estimation constants (steps per MILE) ──────────────────────────────
const STEPS_PER_MILE: Record<string, number> = {
    run: 1400,
    walk: 2100,
    bike: 0, // bikes don't count steps
};

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng]);
    }, [lat, lng, map]);
    return null;
}

// ─── Haversine distance (km) ─────────────────────────────────────────────────
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Component ───────────────────────────────────────────────────────────────
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
    const [elapsedTime, setElapsedTime] = useState(0); // active seconds
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [mileSplits, setMileSplits] = useState<MileSplit[]>([]);
    const [weatherBanner, setWeatherBanner] = useState<string | null>(null);
    const [agentMessages, setAgentMessages] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const watchId = useRef<number | null>(null);
    const lastAcceptedPos = useRef<[number, number] | null>(null);
    const lastPosTimestamp = useRef<number>(0);
    const smoothedPos = useRef<[number, number] | null>(null);
    const agentCoreRef = useRef<AgentCore | null>(null);
    const distanceRef = useRef(0); // mirror of distance state for use in refs
    const stepsRef = useRef(0);    // estimated step count
    const [steps, setSteps] = useState(0);

    // ── Accumulated-segment timer (backgrounding-safe) ────────────────────────
    const activeTimeRef = useRef(0);       // total active seconds
    const lastTickRef = useRef<number>(0); // last Date.now() when tick ran
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isPausedRef = useRef(false);
    const isTrackingRef = useRef(false);

    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
    useEffect(() => { isTrackingRef.current = isTracking; }, [isTracking]);

    useEffect(() => {
        if (isTracking && !isPaused) {
            lastTickRef.current = Date.now();
            timerRef.current = setInterval(() => {
                if (isPausedRef.current || !isTrackingRef.current) return;
                const now = Date.now();
                const delta = Math.round((now - lastTickRef.current) / 1000);
                // Cap delta to 2s to prevent huge jumps when waking from background
                const safeDelta = Math.min(delta, 2);
                activeTimeRef.current += safeDelta;
                lastTickRef.current = now;
                setElapsedTime(activeTimeRef.current);
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isTracking, isPaused]);

    // Get initial location
    useEffect(() => {
        if (environment === "indoor") return;
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
        if (event.message) {
            setAgentMessages((prev) => [...prev.slice(-2), event.message!]);
            setTimeout(() => {
                setAgentMessages((prev) => prev.slice(1));
            }, 8000);
        }
    }, []);

    // ── GPS Position Handler (production-grade filtering) ─────────────────────
    const handlePosition = useCallback((pos: GeolocationPosition) => {
        const { latitude, longitude, speed, accuracy } = pos.coords;
        const now = Date.now();

        // 1. Accuracy gate — reject poor readings
        if (accuracy > GPS_ACCURACY_THRESHOLD) return;

        // 2. Apply exponential moving average smoothing
        let smoothLat: number, smoothLng: number;
        if (smoothedPos.current) {
            smoothLat = smoothedPos.current[0] + SMOOTHING_FACTOR * (latitude - smoothedPos.current[0]);
            smoothLng = smoothedPos.current[1] + SMOOTHING_FACTOR * (longitude - smoothedPos.current[1]);
        } else {
            smoothLat = latitude;
            smoothLng = longitude;
        }
        smoothedPos.current = [smoothLat, smoothLng];

        const newPos: [number, number] = [smoothLat, smoothLng];
        setCurrentPos(newPos);

        if (lastAcceptedPos.current) {
            const segmentKm = haversine(
                lastAcceptedPos.current[0], lastAcceptedPos.current[1],
                smoothLat, smoothLng
            );

            // 3. Minimum distance threshold — ignore stationary jitter
            if (segmentKm < MIN_DISTANCE_THRESHOLD) return;

            // 4. Speed sanity check — reject teleportation
            const dtSec = (now - lastPosTimestamp.current) / 1000;
            if (dtSec > 0) {
                const speedKmh = (segmentKm / dtSec) * 3600;
                if (speedKmh > MAX_SPEED_KMH) return;
            }

            // Accumulate distance
            distanceRef.current += segmentKm;
            setDistance(distanceRef.current);

            // Estimate steps from distance delta
            const segmentMiles = segmentKm * 0.621371;
            const stepsPerMile = STEPS_PER_MILE[mode] ?? STEPS_PER_MILE.run;
            stepsRef.current += Math.round(segmentMiles * stepsPerMile);
            setSteps(stepsRef.current);

            setPath((prev) => [...prev, newPos]);

            // Feed agent core
            const geoPos: GeoPosition = {
                lat: smoothLat,
                lng: smoothLng,
                speed,
                accuracy,
                timestamp: now,
            };
            agentCoreRef.current?.onPositionUpdate(geoPos, distanceRef.current * 0.621371);
        } else {
            // First accepted position — add to path, trigger session start
            setPath([newPos]);
            agentCoreRef.current?.onSessionStart(smoothLat, smoothLng);
        }

        lastAcceptedPos.current = newPos;
        lastPosTimestamp.current = now;
    }, []);

    const triggerCountdown = () => {
        // Unlock Audio (Warmup)
        if (typeof window !== "undefined" && window.speechSynthesis) {
            const u = new SpeechSynthesisUtterance(" ");
            u.volume = 0;
            window.speechSynthesis.speak(u);
        }

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
        setPath([]);
        setDistance(0);
        distanceRef.current = 0;
        setElapsedTime(0);
        activeTimeRef.current = 0;
        setIsPaused(false);
        setMileSplits([]);
        setWeatherBanner(null);
        setAgentMessages([]);
        lastAcceptedPos.current = null;
        smoothedPos.current = null;
        lastPosTimestamp.current = 0;

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
            watchId.current = navigator.geolocation.watchPosition(
                handlePosition,
                (err) => console.error("GPS Error:", err),
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 5000,
                }
            );
        }
    };

    const stopSession = async () => {
        setIsTracking(false);
        setIsPaused(false);
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }

        const core = agentCoreRef.current;
        const splits = core?.getMileSplits() ?? [];
        const pausedSec = core?.getPausedSeconds() ?? 0;
        const weather = core?.getWeather();

        core?.destroy();
        agentCoreRef.current = null;

        // Capture final values from refs (not stale state)
        const finalDistanceKm = distanceRef.current;
        const finalActiveSeconds = activeTimeRef.current;
        const miles = finalDistanceKm * 0.621371;
        const durationSeconds = finalActiveSeconds;

        setSaving(true);

        try {
            if (miles > 0.05) {
                await addActivity({
                    type: getActivityType(mode),
                    distance: parseFloat(miles.toFixed(2)),
                    duration: parseFloat(durationSeconds.toFixed(0)),
                    calories: Math.round(miles * modeConfig.caloriesPerMile),
                    steps: stepsRef.current,
                    date: new Date(),
                    notes: `${getActivityLabel(mode)} — ${environment}`,
                    mode,
                    environment,
                    mileSplits: splits.map(s => Math.round(s.splitSeconds)),
                    pausedDuration: Math.round(pausedSec),
                    ...(weather ? {
                        weatherSnapshot: {
                            temp: weather.temp,
                            condition: weather.condition,
                            humidity: weather.humidity,
                            wind: weather.wind,
                        }
                    } : {}),
                });
                alert(`${getActivityLabel(mode)} Saved! ${miles.toFixed(2)} mi in ${formatTime(durationSeconds)}`);
            } else {
                alert("Session too short to save.");
            }
        } catch (e: any) {
            console.error("Save error:", e);
            alert(`Failed to save session: ${e.message || "Unknown error"}`);
        } finally {
            setSaving(false);
            lastAcceptedPos.current = null;
            smoothedPos.current = null;
            stepsRef.current = 0;
            setSteps(0);
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h > 0 ? h + ':' : ''}${m < 10 && h > 0 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const displayMetric = () => {
        const distMiles = distance * 0.621371;
        if (modeConfig.displayMetric === "mph") {
            if (elapsedTime === 0) return "0.0 mph";
            const hours = elapsedTime / 3600;
            return `${(distMiles / hours).toFixed(1)} mph`;
        }
        if (distMiles === 0) return "0'00\"/mi";
        const paceSecondsPerMile = elapsedTime / distMiles;
        const pMin = Math.floor(paceSecondsPerMile / 60);
        const pSec = Math.floor(paceSecondsPerMile % 60);
        return `${pMin}'${pSec < 10 ? '0' : ''}${pSec}"/mi`;
    };

    const activityLabel = getActivityLabel(mode);
    const isIndoor = environment === "indoor";
    const showMapView = !isIndoor && settings.showMap;

    // ── Stats-only view (indoor or map off) ───────────────────────────────────
    if (isIndoor || !showMapView) {
        return (
            <div style={{ height: "100%", position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--surface)" }}>
                {countdown !== null && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                        <div style={{ fontSize: "120px", fontWeight: "bold", color: "var(--primary)", animation: "ping 1s infinite" }}>{countdown}</div>
                    </div>
                )}

                {isPaused && isTracking && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 450, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ fontSize: "32px", fontWeight: "bold", color: "var(--warning)", animation: "pulse 2s infinite" }}>⏸ PAUSED</div>
                    </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px", gap: "30px" }}>
                    <div style={{ fontSize: "14px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "2px" }}>{isIndoor ? "🏠 Indoor" : "📡 Outdoor"} {activityLabel}</div>

                    <div style={{ fontSize: "64px", fontWeight: "bold" }}>{formatTime(elapsedTime)}</div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", textAlign: "center" }}>
                        <div>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>DISTANCE</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{(distance * 0.621371).toFixed(2)} <span style={{ fontSize: "14px" }}>mi</span></div>
                        </div>
                        <div>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{modeConfig.displayMetric === "mph" ? "SPEED" : "PACE"}</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{displayMetric()}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>STEPS</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{steps.toLocaleString()}</div>
                        </div>
                    </div>

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

                    {agentMessages.length > 0 && (
                        <div style={{ position: "absolute", bottom: 100, left: 20, right: 20, zIndex: 400 }}>
                            {agentMessages.map((msg, i) => (
                                <div key={i} className="glass-panel" style={{ padding: "10px 16px", borderRadius: "var(--radius-md)", marginBottom: "8px", fontSize: "14px", color: "var(--secondary)", animation: "fadeIn 0.3s ease" }}>
                                    🤖 {msg}
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)", display: "flex", gap: "20px" }}>
                        {!isTracking ? (
                            <button onClick={triggerCountdown} className="btn-primary" style={{ padding: "16px 48px", fontSize: "18px", borderRadius: "var(--radius-full)" }}>
                                START {activityLabel.toUpperCase()}
                            </button>
                        ) : (
                            <button onClick={stopSession} disabled={saving} style={{ background: saving ? "#888" : "#ff4444", color: "white", border: "none", padding: "16px 48px", fontSize: "18px", borderRadius: "var(--radius-full)", fontWeight: "bold", cursor: saving ? "not-allowed" : "pointer" }}>
                                {saving ? "SAVING..." : "STOP"}
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

    // ── Map view ──────────────────────────────────────────────────────────────
    return (
        <div style={{ height: "100%", position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {countdown !== null && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                    <div style={{ fontSize: "120px", fontWeight: "bold", color: "var(--primary)", animation: "ping 1s infinite" }}>{countdown}</div>
                </div>
            )}

            {isPaused && isTracking && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 450, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ fontSize: "36px", fontWeight: "bold", color: "var(--warning)", animation: "pulse 2s infinite" }}>⏸ PAUSED</div>
                </div>
            )}

            {weatherBanner && isTracking && (
                <div style={{ position: "absolute", top: 90, left: 20, right: 20, zIndex: 401, padding: "10px 16px", borderRadius: "var(--radius-md)", background: "rgba(0,229,255,0.15)", border: "1px solid rgba(0,229,255,0.3)", fontSize: "13px", color: "var(--secondary)" }}>
                    🌤 {weatherBanner.slice(0, 120)}{weatherBanner.length > 120 ? "..." : ""}
                </div>
            )}

            {/* Stats Overlay */}
            <div className="glass-panel" style={{ position: "absolute", top: 20, left: 20, right: 20, zIndex: 400, padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", textAlign: "center" }}>
                <div>
                    <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>DISTANCE</div>
                    <div style={{ fontSize: "20px", fontWeight: "bold" }}>{(distance * 0.621371).toFixed(2)} <span style={{ fontSize: "12px" }}>mi</span></div>
                </div>
                <div>
                    <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>TIME</div>
                    <div style={{ fontSize: "20px", fontWeight: "bold" }}>{formatTime(elapsedTime)}</div>
                </div>
                <div>
                    <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>{modeConfig.displayMetric === "mph" ? "SPEED" : "PACE"}</div>
                    <div style={{ fontSize: "20px", fontWeight: "bold" }}>{displayMetric()}</div>
                </div>
                <div>
                    <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>STEPS</div>
                    <div style={{ fontSize: "20px", fontWeight: "bold" }}>{steps.toLocaleString()}</div>
                </div>
            </div>

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
                    <button onClick={stopSession} disabled={saving} style={{ background: saving ? "#888" : "#ff4444", color: "white", border: "none", padding: "16px 48px", fontSize: "18px", borderRadius: "var(--radius-full)", fontWeight: "bold", cursor: saving ? "not-allowed" : "pointer" }}>
                        {saving ? "SAVING..." : "STOP"}
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
