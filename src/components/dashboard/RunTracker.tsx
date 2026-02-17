"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to recenter map on user location
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng]);
    }, [lat, lng, map]);
    return null;
}

export default function RunTracker() {
    const [isTracking, setIsTracking] = useState(false);
    const [path, setPath] = useState<[number, number][]>([]);
    const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
    const [distance, setDistance] = useState(0); // in km
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0); // in seconds
    const watchId = useRef<number | null>(null);
    const lastPos = useRef<[number, number] | null>(null);

    // Get initial location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setCurrentPos([latitude, longitude]);
                },
                (err) => console.error(err),
                { enableHighAccuracy: true }
            );
        }
    }, []);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTracking && startTime) {
            interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTracking, startTime]);

    const startRun = () => {
        setIsTracking(true);
        setStartTime(Date.now());
        setPath([]);
        setDistance(0);
        setElapsedTime(0);

        if (navigator.geolocation) {
            watchId.current = navigator.geolocation.watchPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    const newPos: [number, number] = [latitude, longitude];

                    setCurrentPos(newPos);
                    setPath((prev) => [...prev, newPos]);

                    // Calculate distance
                    if (lastPos.current) {
                        const dist = calculateDistance(
                            lastPos.current[0], lastPos.current[1],
                            latitude, longitude
                        );
                        setDistance((prev) => prev + dist);
                    }
                    lastPos.current = newPos;
                },
                (err) => console.error(err),
                { enableHighAccuracy: true }
            );
        }
    };

    const stopRun = () => {
        setIsTracking(false);
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
        // Ideally save to Firestore here
        alert(`Run Finished! Distance: ${distance.toFixed(2)}km, Time: ${formatTime(elapsedTime)}`);
    };

    // Haversine formula for distance in km
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth radius in km
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

    const calculatePace = () => {
        if (distance === 0) return "0'00\"";
        const paceSecondsPerKm = elapsedTime / distance;
        const widthMin = Math.floor(paceSecondsPerKm / 60);
        const widthSec = Math.floor(paceSecondsPerKm % 60);
        return `${widthMin}'${widthSec < 10 ? '0' : ''}${widthSec}"/km`;
    };

    if (!currentPos) {
        return <div style={{ color: "white", padding: 20 }}>Locating GPS...</div>;
    }

    return (
        <div style={{ height: "100%", position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {/* Stats Overlay */}
            <div className="glass-panel" style={{
                position: "absolute",
                top: 20,
                left: 20,
                right: 20,
                zIndex: 400,
                padding: "20px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "10px",
                textAlign: "center"
            }}>
                <div>
                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>DISTANCE</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>{distance.toFixed(2)} <span style={{ fontSize: "14px" }}>km</span></div>
                </div>
                <div>
                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>TIME</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>{formatTime(elapsedTime)}</div>
                </div>
                <div>
                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>PACE</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>{calculatePace()}</div>
                </div>
            </div>

            {/* Map */}
            <MapContainer
                center={currentPos}
                zoom={16}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
            >
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
            <div style={{
                position: "absolute",
                bottom: 30,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 400,
                display: "flex",
                gap: "20px"
            }}>
                {!isTracking ? (
                    <button
                        onClick={startRun}
                        className="btn-primary"
                        style={{ padding: "16px 48px", fontSize: "18px", borderRadius: "var(--radius-full)" }}
                    >
                        START RUN
                    </button>
                ) : (
                    <button
                        onClick={stopRun}
                        style={{
                            background: "#ff4444",
                            color: "white",
                            border: "none",
                            padding: "16px 48px",
                            fontSize: "18px",
                            borderRadius: "var(--radius-full)",
                            fontWeight: "bold",
                            cursor: "pointer"
                        }}
                    >
                        STOP
                    </button>
                )}
            </div>
        </div>
    );
}
