"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(mod => mod.Polyline), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

interface Props {
    center: [number, number];
    zoom: number;
    path?: [number, number][];
}

export default function ActivityMap({ center, zoom, path }: Props) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Small delay to ensure DOM is fully painted before Leaflet attaches
        const timer = setTimeout(() => setReady(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (!ready) {
        return (
            <div style={{
                width: "100%", height: "260px", background: "rgba(255,255,255,0.03)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <div style={{
                    width: "24px", height: "24px", borderRadius: "50%",
                    border: "2px solid var(--primary)", borderTopColor: "transparent",
                    animation: "spin 0.8s linear infinite",
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ width: "100%", height: "260px", position: "relative" }}>
            <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />
                {path && path.length > 0 && (
                    <>
                        <Polyline positions={path} color="var(--primary, #ff4d00)" weight={4} opacity={0.9} />
                        <Marker position={path[0]}><Popup>Start</Popup></Marker>
                        <Marker position={path[path.length - 1]}><Popup>End</Popup></Marker>
                    </>
                )}
            </MapContainer>
        </div>
    );
}
