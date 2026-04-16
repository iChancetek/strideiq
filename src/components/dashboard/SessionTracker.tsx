"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import { useSettings } from "@/context/SettingsContext";
import { useActivities } from "@/hooks/useActivities";
import { useAuth } from "@/context/AuthContext";
import { AgentCore } from "@/lib/agents/agent-core";
import { GeoPosition, AgentEvent, MileSplit } from "@/lib/agents/types";
import { getActivityLabel, getActivityType, getModeConfig } from "@/lib/agents/mode-agent";
import PostSessionModal from "./PostSessionModal";
import { t } from "@/lib/translations";
import { getActiveSession, saveActiveSession, clearActiveSession } from "@/lib/utils/idb";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { uploadMediaFiles } from "@/lib/storage";

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
const MAX_SPEED_KMH = 60;            // ~37 mph — reject teleportation glitches
const SMOOTHING_FACTOR = 0.35;        // exponential moving average weight for new readings

// ─── Step estimation constants (steps per MILE) ──────────────────────────────
const STEPS_PER_MILE: Record<string, number> = {
    run: 1400,
    walk: 2100,
    bike: 0, // bikes don't count steps
    hike: 1800,
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
    const lang = settings.language;
    const { addActivity } = useActivities();
    const { user } = useAuth();
    const mode = settings.activityMode;
    const environment = settings.environment;
    const modeConfig = getModeConfig(mode);

    // ── Session persistence key ───────────────────────────────────────────────
    const SESSION_KEY = "strideiq_active_session";

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
    const [showPostModal, setShowPostModal] = useState(false);
    const [pendingSessionData, setPendingSessionData] = useState<any>(null);
    const [mapVisible, setMapVisible] = useState(settings.showMap);
    const [sessionRestoreData, setSessionRestoreData] = useState<any>(null); // orphaned session from prior page load
    const [isRestoring, setIsRestoring] = useState(false);
    const [heartRate, setHeartRate] = useState(0);

    const watchId = useRef<number | null>(null);
    const lastAcceptedPos = useRef<[number, number] | null>(null);
    const lastPosTimestamp = useRef<number>(0);
    const smoothedPos = useRef<[number, number] | null>(null);
    const agentCoreRef = useRef<AgentCore | null>(null);
    const distanceRef = useRef(0); // mirror of distance state for use in refs
    const stepsRef = useRef(0);    // estimated step count
    const sessionStartTsRef = useRef<number>(0); // wall-clock timestamp when session started
    const totalPausedMsRef = useRef<number>(0);   // accumulated paused wall-clock ms
    const pauseStartWallRef = useRef<number | null>(null); // when current pause began (wall clock)
    const [steps, setSteps] = useState(0);

    // ── Accumulated-segment timer (backgrounding-safe) ────────────────────────
    const activeTimeRef = useRef(0);       // total active seconds
    const pathRef = useRef<[number, number][]>([]); // mirror of path state for persistence
    const lastTickRef = useRef<number>(0); // last Date.now() when tick ran
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isPausedRef = useRef(false);
    const isTrackingRef = useRef(false);

    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
    useEffect(() => { isTrackingRef.current = isTracking; }, [isTracking]);

    // ── Check for orphaned session from IndexedDB (Auto-Resume) ───────────
    useEffect(() => {
        async function checkRestore() {
            try {
                const saved = await getActiveSession('run');
                if (saved && saved.data) {
                    const startTs = new Date(saved.startTime).getTime();
                    // Auto-restore if < 2 hours old
                    if ((Date.now() - startTs) < 2 * 3600 * 1000) {
                        console.log("[AUTH_SESSION_RESTORE] Resuming recently active session:", saved);
                        await handleRestoreSession(saved);
                    } else {
                        await clearActiveSession('run');
                    }
                }
            } catch (e) { console.error("[RESTORE_FAILED]", e); }
        }
        checkRestore();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRestoreSession = async (saved: any) => {
        setIsRestoring(true);
        const data = saved.data;
        const startTs = new Date(saved.startTime).getTime();
        
        // 1. Calculate elapsed time correctly (now - start - paused)
        const totalPaused = data.totalPausedMs || 0;
        const elapsed = Math.round((Date.now() - startTs - totalPaused) / 1000);
        
        // 2. Hydrate refs
        sessionStartTsRef.current = startTs;
        totalPausedMsRef.current = totalPaused;
        activeTimeRef.current = elapsed;
        distanceRef.current = data.distanceKm || 0;
        stepsRef.current = data.steps || 0;
        
        // 3. Set States
        setElapsedTime(elapsed);
        setDistance(data.distanceKm || 0);
        setSteps(data.steps || 0);
        const restoredPath = data.path || [];
        setPath(restoredPath);
        pathRef.current = restoredPath;

        if (restoredPath.length > 0) {
            const last = restoredPath[restoredPath.length - 1];
            lastAcceptedPos.current = last;
            setCurrentPos(last);
        }

        // 4. Initialize and hydrate AgentCore
        const core = new AgentCore({
            mode: data.mode || mode,
            environment: data.environment || environment,
            autoPause: settings.autoPause,
            autoPauseSensitivity: settings.autoPauseSensitivity,
            voiceCoaching: settings.voiceCoaching,
            weatherAnnouncements: settings.weatherAnnouncements,
        });

        core.restoreSession({
            startTime: startTs,
            lastMileCompleted: data.lastMileCompleted || 0,
            lastMileActiveTime: data.lastMileActiveTime || 0,
            mileSplits: data.mileSplits || [],
            totalPausedSeconds: Math.floor(totalPaused / 1000)
        });

        core.on(handleAgentEvent);
        agentCoreRef.current = core;

        // 5. Restart GPS tracking if outdoor
        if (data.environment === "outdoor" && navigator.geolocation) {
            watchId.current = navigator.geolocation.watchPosition(
                handlePosition,
                (err) => console.error("GPS Error:", err),
                { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
            );
        }

        setIsTracking(true);
        setIsRestoring(false);
    };

    // ── Persist session state to IndexedDB on each tick ─────────────────
    const persistSession = useCallback(async () => {
        if (!isTrackingRef.current) return;
        try {
            await saveActiveSession({
                type: 'run',
                startTime: new Date(sessionStartTsRef.current).toISOString(),
                lastHeartbeat: new Date().toISOString(),
                data: {
                    totalPausedMs: totalPausedMsRef.current,
                    distanceKm: distanceRef.current,
                    steps: stepsRef.current,
                    mode,
                    environment,
                    path: pathRef.current,
                    mileSplits: agentCoreRef.current?.getMileSplits() || [],
                    lastMileActiveTime: agentCoreRef.current?.getLastMileActiveTime() || 0,
                    lastMileCompleted: agentCoreRef.current?.getLastMileCompleted() || 0,
                    heartRate,
                }
            });
        } catch (e) { /* ignore storage errors */ }
    }, [mode, environment]);

    // ── Page Visibility API: resync timer when phone unlocks / app foregrounds ─
    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === "visible" && isTrackingRef.current && !isPausedRef.current) {
                // Recalculate elapsed time from wall clock — setInterval may have missed ticks
                const now = Date.now();
                const wallElapsed = (now - sessionStartTsRef.current - totalPausedMsRef.current) / 1000;
                if (wallElapsed > activeTimeRef.current) {
                    console.log("[BACKGROUND_TIMER_RESUME] Resyncing timer from wall clock.", {
                        stored: activeTimeRef.current,
                        actual: wallElapsed,
                    });
                    activeTimeRef.current = Math.round(wallElapsed);
                    setElapsedTime(activeTimeRef.current);
                    lastTickRef.current = now;
                }
            }
        };
        document.addEventListener("visibilitychange", onVisibilityChange);
        return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    }, []);

    useEffect(() => {
        if (isTracking && !isPaused && environment === 'indoor') {
            let lastAcel = 0;
            const threshold = 1.2; // G-force threshold for step detection
            
            const handleMotion = (event: DeviceMotionEvent) => {
                const accel = event.accelerationIncludingGravity;
                if (!accel) return;
                
                const totalAccel = Math.sqrt((accel.x || 0)**2 + (accel.y || 0)**2 + (accel.z || 0)**2);
                const delta = totalAccel - lastAcel;
                lastAcel = totalAccel;
                
                if (delta > threshold) {
                    stepsRef.current += 1;
                    setSteps(stepsRef.current);
                    
                    // Estimate distance: steps * stride_length (standard 0.762m)
                    const segmentKm = 0.000762; 
                    distanceRef.current += segmentKm;
                    setDistance(distanceRef.current);
                }
            };

            window.addEventListener('devicemotion', handleMotion);
            return () => window.removeEventListener('devicemotion', handleMotion);
        }
    }, [isTracking, isPaused, environment]);

    // Persist to IDB only

    useEffect(() => {
        if (isTracking && !isPaused) {
            lastTickRef.current = Date.now();
            timerRef.current = setInterval(() => {
                if (isPausedRef.current || !isTrackingRef.current) return;
                const now = Date.now();
                // Wall-clock delta — survives iOS/Android PWA backgrounding
                activeTimeRef.current += delta;
                lastTickRef.current = now;
                setElapsedTime(activeTimeRef.current);
                
                // Poll heart rate from agent core
                if (agentCoreRef.current) {
                    setHeartRate(agentCoreRef.current.getHeartRate());
                }
                
                persistSession(); // write snapshot every second
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isTracking, isPaused, persistSession]);

    // ── Screen Wake Lock ──────────────────────────────────────────────────────
    const wakeLockRef = useRef<any>(null);

    useEffect(() => {
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                } catch (err: any) {
                    console.log(`Wake Lock error: ${err.message}`);
                }
            }
        };

        if (isTracking && !isPaused) {
            requestWakeLock();
        } else if (wakeLockRef.current) {
            wakeLockRef.current.release().then(() => { wakeLockRef.current = null; });
        }

        // Also release on unmount
        return () => {
            if (wakeLockRef.current) {
                wakeLockRef.current.release().catch(() => { });
            }
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
                // Start wall-clock tracking for this pause — critical for background timer accuracy
                if (pauseStartWallRef.current === null) {
                    pauseStartWallRef.current = Date.now();
                    console.log("[SESSION_PAUSE] Agent auto-pause initiated.");
                }
                break;
            case "session:resume":
                setIsPaused(false);
                // Accumulate wall-clock pause duration
                if (pauseStartWallRef.current !== null) {
                    totalPausedMsRef.current += Date.now() - pauseStartWallRef.current;
                    pauseStartWallRef.current = null;
                    console.log("[SESSION_RESUME] Agent auto-resume. totalPausedMs=" + totalPausedMsRef.current);
                }
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

        // 2. Immediate auto-resume hack removed — MovementAgent handles this instantaneously now.

        const dtSec = lastPosTimestamp.current > 0 ? (now - lastPosTimestamp.current) / 1000 : 0;

        // 3. Apply exponential moving average smoothing
        let smoothLat: number, smoothLng: number;
        // If it's been >5 seconds since the last point (e.g. background wake), reset smoothing to prevent losing distance to 'rubber banding'
        if (smoothedPos.current && dtSec < 5) {
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

            // 4. Minimum distance threshold — ignore stationary jitter
            if (segmentKm < MIN_DISTANCE_THRESHOLD) return;

            // 5. Speed sanity check — reject teleportation glitch (only if dt is normal scale, ignore huge jumps from backgrounding hours)
            if (dtSec > 0 && dtSec < 3600) {
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

            setPath((prev) => {
                const newPath = [...prev, newPos];
                pathRef.current = newPath;
                return newPath;
            });

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
        lastTickRef.current = Date.now();
        sessionStartTsRef.current = Date.now(); // ← wall-clock session start
        totalPausedMsRef.current = 0;
        pauseStartWallRef.current = null;
        setIsPaused(false);
        setMileSplits([]);
        setWeatherBanner(null);
        setAgentMessages([]);
        lastAcceptedPos.current = null;
        smoothedPos.current = null;
        lastPosTimestamp.current = 0;
        stepsRef.current = 0;
        setSteps(0);
        console.log("[SESSION_START] mode=" + mode + " env=" + environment);

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

        if (environment === "outdoor" && navigator.geolocation && mode !== "meditation") {
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

        // Write initial snapshot to IDB
        try {
            await saveActiveSession({
                type: 'run',
                startTime: new Date(sessionStartTsRef.current).toISOString(),
                lastHeartbeat: new Date().toISOString(),
                data: {
                    totalPausedMs: 0,
                    distanceKm: 0,
                    steps: 0,
                    mode,
                    environment,
                }
            });
        } catch (e) { /* ignore */ }
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
        console.log("[SESSION_END] miles=" + miles.toFixed(2) + " duration=" + durationSeconds + "s");

        const isTimeBased = mode === "meditation" || mode === "fasting";
        if (miles < 0.05 && !isTimeBased) {
            alert("Session too short to save.");
            await clearActiveSession('run');
            lastAcceptedPos.current = null;
            smoothedPos.current = null;
            stepsRef.current = 0;
            setSteps(0);
            return;
        }

        // Show the PostSessionModal with session data
        setPendingSessionData({
            distanceMiles: parseFloat(miles.toFixed(2)),
            durationSeconds: parseFloat(durationSeconds.toFixed(0)),
            calories: Math.round(miles * modeConfig.caloriesPerMile),
            steps: stepsRef.current,
            mode,
            environment,
            mileSplits: splits.map(s => Math.round(s.splitSeconds)),
            pausedDuration: Math.round(pausedSec),
            weatherSnapshot: weather ? {
                temp: weather.temp,
                condition: weather.condition,
                humidity: weather.humidity,
                wind: weather.wind,
            } : undefined,
        });
        setShowPostModal(true);
    };

    /** Retry wrapper — up to 3 attempts with exponential backoff */
    async function retryAsync<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
        let lastErr: any;
        for (let i = 0; i < attempts; i++) {
            try {
                return await fn();
            } catch (e) {
                lastErr = e;
                if (i < attempts - 1) {
                    await new Promise(r => setTimeout(r, 500 * Math.pow(2, i)));
                }
            }
        }
        throw lastErr;
    }

    const handlePostSessionSave = async (data: { notes: string; title: string; mediaFiles: File[]; isPublic: boolean }) => {
        if (!pendingSessionData) return;
        if (!user) return;
        setSaving(true);
        console.log("[SESSION_SAVE_ATTEMPT] Starting save...");
        try {
            // Upload media files to Firebase Storage
            const mediaItems = await uploadMediaFiles(data.mediaFiles, user.uid);

            const { activityId } = await retryAsync(() => addActivity({
                type: getActivityType(mode),
                distance: pendingSessionData.distanceMiles,
                duration: pendingSessionData.durationSeconds,
                calories: pendingSessionData.calories,
                steps: pendingSessionData.steps,
                date: new Date(),
                notes: data.notes || `${getActivityLabel(mode)} — ${environment}`,
                title: data.title,
                isPublic: data.isPublic,
                mode: pendingSessionData.mode,
                environment: pendingSessionData.environment,
                mileSplits: pendingSessionData.mileSplits,
                pausedDuration: pendingSessionData.pausedDuration,
                ...(pendingSessionData.weatherSnapshot ? { weatherSnapshot: pendingSessionData.weatherSnapshot } : {}),
                ...(mediaItems.length > 0 ? { media: mediaItems } : {}),
            }), 3);

            console.log("[SESSION_SAVE_SUCCESS] Activity saved successfully. ID:", activityId);

            const token = await user.getIdToken();
            // Trigger AI Coaching Analysis (Background)
            fetch("/api/ai/coach", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ activityId }),
            }).then(res => res.json())
              .then(aiRes => console.log("[AI_COACH_SUCCESS]", aiRes))
              .catch(err => console.error("[AI_COACH_FAILURE]", err));

            sessionStorage.removeItem(SESSION_KEY);
            await clearActiveSession('run');
            setShowPostModal(false);
            setPendingSessionData(null);
        } catch (e: any) {
            console.error("[SESSION_SAVE_FAILURE]", e);
            alert(`Failed to save session: ${e.message || "Unknown error"}. Please try again.`);
        } finally {
            setSaving(false);
            lastAcceptedPos.current = null;
            smoothedPos.current = null;
            stepsRef.current = 0;
            setSteps(0);
        }
    };

    const toggleManualPause = () => {
        if (isPaused) {
            // Resume: track wall-clock pause duration for accurate background timer
            if (pauseStartWallRef.current !== null) {
                totalPausedMsRef.current += Date.now() - pauseStartWallRef.current;
                pauseStartWallRef.current = null;
            }
            agentCoreRef.current?.manualResume();
            setIsPaused(false);
            console.log("[SESSION_RESUME] Manual resume. totalPausedMs=" + totalPausedMsRef.current);
        } else {
            pauseStartWallRef.current = Date.now(); // start tracking pause wall time
            agentCoreRef.current?.manualPause();
            setIsPaused(true);
            console.log("[SESSION_PAUSE] Manual pause.");
        }
    };

    const handleDiscardSession = async () => {
        setShowPostModal(false);
        setPendingSessionData(null);
        sessionStorage.removeItem(SESSION_KEY);
        await clearActiveSession('run');
        lastAcceptedPos.current = null;
        smoothedPos.current = null;
        stepsRef.current = 0;
        setSteps(0);
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
    const showMapView = !isIndoor && mapVisible;

    // ── Stats-only view (indoor or map off) ───────────────────────────────────
    if (isIndoor || !showMapView) {
        return (
            <div style={{ height: "100%", position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--surface)" }}>
                {countdown !== null && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                        <div style={{ fontSize: "120px", fontWeight: "bold", color: "var(--primary)", animation: "ping 1s infinite" }}>{countdown}</div>
                    </div>
                )}

                {/* Restore Loading Bridge */}
                {isRestoring && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px" }}>
                        <div className="skeleton" style={{ width: "40px", height: "40px", borderRadius: "50%" }}></div>
                        <div style={{ color: "var(--primary)", fontWeight: 700 }}>Resuming Elite Session...</div>
                    </div>
                )}

                {isPaused && isTracking && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 450, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ fontSize: "32px", fontWeight: "bold", color: "var(--warning)", animation: "pulse 2s infinite" }}>⏸ {t(lang, "sessionPaused")}</div>
                    </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px", gap: "30px" }}>
                    <div style={{ fontSize: "14px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "2px" }}>
                        {isIndoor ? `🏠 ${t(lang, "indoor")}` : `📡 ${t(lang, "outdoor")}`} {t(lang, mode.toLowerCase() as any) || mode}
                    </div>

                    <div style={{ fontSize: "64px", fontWeight: "bold" }}>{formatTime(elapsedTime)}</div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", width: "100%", maxWidth: "400px" }}>
                        <div className="glass-panel" style={{ padding: "20px", textAlign: "center", borderRadius: "16px" }}>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{t(lang, "distance")}</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{(distance * 0.621371).toFixed(2)} <span style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>{settings.units === "imperial" ? "mi" : "km"}</span></div>
                        </div>
                        <div className="glass-panel" style={{ padding: "20px", textAlign: "center", borderRadius: "16px" }}>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{modeConfig.displayMetric === "mph" ? t(lang, "speed") : t(lang, "pace")}</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{displayMetric()}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{t(lang, "steps").toUpperCase()}</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{steps.toLocaleString()}</div>
                        </div>
                    </div>

                    {mileSplits.length > 0 && (
                        <div style={{ width: "100%", maxWidth: "300px" }}>
                            <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "8px" }}>{t(lang, "mileSplits")}</div>
                            {mileSplits.map((s) => (
                                <div key={s.mile} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                    <span>{t(lang, "splits")} {s.mile}</span>
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

                    <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", gap: "16px", alignItems: "center", zIndex: 505 }}>
                        {!isTracking ? (
                            <button onClick={triggerCountdown} className="btn-primary" style={{ padding: "16px 48px", fontSize: "18px", borderRadius: "var(--radius-full)" }}>
                                {t(lang, "startSession")} {t(lang, mode.toLowerCase() as any)?.toUpperCase() || mode.toUpperCase()}
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={toggleManualPause}
                                    style={{
                                        background: isPaused ? "var(--primary)" : "rgba(255,170,0,0.15)",
                                        color: isPaused ? "#000" : "var(--warning)",
                                        border: `2px solid ${isPaused ? "var(--primary)" : "var(--warning)"}`,
                                        padding: "14px 28px",
                                        fontSize: "17px",
                                        borderRadius: "var(--radius-full)",
                                        fontWeight: "bold",
                                        cursor: "pointer",
                                        minWidth: "120px",
                                    }}
                                >
                                    {isPaused ? "▶ Resume" : "⏸ Pause"}
                                </button>
                                {/* Map toggle — only shown for outdoor when map capable */}
                                {!isIndoor && (
                                    <button
                                        onClick={() => setMapVisible(v => !v)}
                                        title={mapVisible ? "Hide Map" : "Show Map"}
                                        style={{
                                            background: "rgba(255,255,255,0.08)",
                                            color: "var(--foreground)",
                                            border: "2px solid rgba(255,255,255,0.15)",
                                            padding: "14px 18px",
                                            fontSize: "18px",
                                            borderRadius: "var(--radius-full)",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {mapVisible ? "🗺" : "📊"}
                                    </button>
                                )}
                                <button
                                    onClick={stopSession}
                                    disabled={saving}
                                    style={{ background: saving ? "#888" : "#ff4444", color: "white", border: "none", padding: "14px 36px", fontSize: "17px", borderRadius: "var(--radius-full)", fontWeight: "bold", cursor: saving ? "not-allowed" : "pointer" }}
                                >
                                    {saving ? t(lang, "sessionSaving") : t(lang, "stopSession")}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <style jsx>{`
                    @keyframes ping { 0% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(0.8); opacity: 0.5; } }
                    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                `}</style>

                {showPostModal && pendingSessionData && (
                    <PostSessionModal
                        session={pendingSessionData}
                        onSave={handlePostSessionSave}
                        onDiscard={handleDiscardSession}
                    />
                )}
            </div>
        );
    }

    // Outdoor — waiting for GPS
    if (!currentPos) {
        return <div style={{ color: "white", padding: 20, display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ animation: "pulse 1.5s infinite" }}>📡</span> {t(lang, "locatingGPS")}
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
                    <div style={{ fontSize: "36px", fontWeight: "bold", color: "var(--warning)", animation: "pulse 2s infinite" }}>⏸ {t(lang, "sessionPaused")}</div>
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
                    <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>{t(lang, "distance").toUpperCase()}</div>
                    <div style={{ fontSize: "20px", fontWeight: "bold" }}>{(distance * 0.621371).toFixed(2)} <span style={{ fontSize: "12px" }}>{settings.units === "imperial" ? "mi" : "km"}</span></div>
                </div>
                <div>
                    <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>{t(lang, "time").toUpperCase()}</div>
                    <div style={{ fontSize: "20px", fontWeight: "bold" }}>{formatTime(elapsedTime)}</div>
                </div>
                <div>
                    <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>{modeConfig.displayMetric === "mph" ? t(lang, "speed").toUpperCase() : t(lang, "pace").toUpperCase()}</div>
                    <div style={{ fontSize: "20px", fontWeight: "bold" }}>{displayMetric()}</div>
                </div>
                <div>
                    <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>{t(lang, "steps").toUpperCase()}</div>
                    <div style={{ fontSize: "20px", fontWeight: "bold" }}>{steps.toLocaleString()}</div>
                </div>
            </div>

            {mileSplits.length > 0 && (
                <div className="glass-panel" style={{ position: "absolute", top: 140, right: 20, zIndex: 400, padding: "12px", borderRadius: "var(--radius-md)", maxHeight: "200px", overflowY: "auto", minWidth: "140px" }}>
                    <div style={{ fontSize: "10px", color: "var(--foreground-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{t(lang, "splits")}</div>
                    {mileSplits.map((s) => (
                        <div key={s.mile} style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13px", padding: "2px 0" }}>
                            <span style={{ color: "var(--foreground-muted)" }}>Mi {s.mile}</span>
                            <span style={{ color: "var(--primary)", fontWeight: 600 }}>{formatTime(Math.floor(s.splitSeconds))}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ... agent messages map view ... */}
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
                {/* ... map layers ... */}
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
            <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 505, display: "flex", gap: "16px", alignItems: "center" }}>
                {!isTracking ? (
                    <button onClick={triggerCountdown} className="btn-primary" style={{ padding: "16px 48px", fontSize: "18px", borderRadius: "var(--radius-full)" }}>
                        {t(lang, "startSession")} {t(lang, mode.toLowerCase() as any)?.toUpperCase() || mode.toUpperCase()}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={toggleManualPause}
                            style={{
                                background: isPaused ? "var(--primary)" : "rgba(255,170,0,0.15)",
                                color: isPaused ? "#000" : "var(--warning)",
                                border: `2px solid ${isPaused ? "var(--primary)" : "var(--warning)"}`,
                                padding: "14px 28px",
                                fontSize: "17px",
                                borderRadius: "var(--radius-full)",
                                fontWeight: "bold",
                                cursor: "pointer",
                                minWidth: "120px",
                                backdropFilter: "blur(8px)",
                            }}
                        >
                            {isPaused ? "▶ Resume" : "⏸ Pause"}
                        </button>
                        {/* Map toggle button */}
                        <button
                            onClick={() => setMapVisible(v => !v)}
                            title={"Hide Map (GPS still active)"}
                            style={{
                                background: "rgba(0,0,0,0.35)",
                                color: "#fff",
                                border: "2px solid rgba(255,255,255,0.2)",
                                padding: "14px 18px",
                                fontSize: "18px",
                                borderRadius: "var(--radius-full)",
                                cursor: "pointer",
                                backdropFilter: "blur(8px)",
                            }}
                        >
                            📊
                        </button>
                        <button
                            onClick={stopSession}
                            disabled={saving}
                            style={{ background: saving ? "#888" : "#ff4444", color: "white", border: "none", padding: "14px 36px", fontSize: "17px", borderRadius: "var(--radius-full)", fontWeight: "bold", cursor: saving ? "not-allowed" : "pointer", backdropFilter: "blur(8px)" }}
                        >
                            {saving ? t(lang, "sessionSaving") : t(lang, "stopSession")}
                        </button>
                    </>
                )}
            </div>

            <style jsx>{`
                @keyframes ping { 0% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(0.8); opacity: 0.5; } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            {showPostModal && pendingSessionData && (
                <PostSessionModal
                    session={pendingSessionData}
                    onSave={handlePostSessionSave}
                    onDiscard={handleDiscardSession}
                />
            )}
        </div>
    );
}
