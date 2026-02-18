"use client";

import { Share2, Twitter, Facebook, Copy, Check } from "lucide-react";
import { useState } from "react";

interface ShareActivityModalProps {
    activity: {
        id: string;
        type: string;
        distance: number;
        duration: number;
        date: any;
        steps?: number;
    };
    onClose: () => void;
}

export default function ShareActivityModal({ activity, onClose }: ShareActivityModalProps) {
    const [copied, setCopied] = useState(false);

    // Format metrics
    const distanceStr = `${activity.distance.toFixed(2)} mi`;
    const shareUrl = `${window.location.origin}/dashboard/activities/${activity.id}`; // In real app, might need a public share link if dashboard is private
    // Using current URL for now, assuming user might screenshot or share to friends who also use app.
    // Ideally, we'd have a publicOG image route.

    const shareText = `I just ran ${distanceStr} on StrideIQ! 🏃‍♂️💨 Check out my stats.`;

    const handleCopy = () => {
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "My StrideIQ Activity",
                    text: shareText,
                    url: shareUrl
                });
            } catch (err) {
                console.log("Share cancelled");
            }
        }
    };

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }} onClick={onClose}>
            <div className="glass-panel" style={{ padding: "30px", borderRadius: "24px", width: "90%", maxWidth: "400px" }} onClick={e => e.stopPropagation()}>
                <h3 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px", textAlign: "center" }}>Share Achievement</h3>

                {/* Preview Card */}
                <div style={{ background: "linear-gradient(135deg, #222, #111)", padding: "20px", borderRadius: "16px", marginBottom: "30px", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
                    <div style={{ fontSize: "48px", marginBottom: "10px" }}>🔥</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>{activity.distance.toFixed(2)} miles</div>
                    <div style={{ color: "var(--foreground-muted)" }}>{activity.type.toUpperCase()} • StrideIQ</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                    {/* Native Share (Mobile) */}
                    {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                        <button onClick={handleNativeShare} className="btn-primary" style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%" }}>
                            <Share2 size={18} /> Share via...
                        </button>
                    )}

                    {/* Desktop / Fallbacks */}
                    <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="glass-panel"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px", borderRadius: "12px", color: "#fff", textDecoration: "none" }}
                    >
                        <Twitter size={20} fill="#fff" />
                    </a>
                    <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="glass-panel"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "12px", borderRadius: "12px", color: "#fff", textDecoration: "none" }}
                    >
                        <Facebook size={20} fill="#fff" />
                    </a>
                </div>

                <button
                    onClick={handleCopy}
                    className="glass-panel"
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "12px", borderRadius: "12px", background: copied ? "rgba(0, 255, 128, 0.1)" : undefined, borderColor: copied ? "var(--success)" : undefined, color: copied ? "var(--success)" : "#fff" }}
                >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? "Copied Link!" : "Copy Link"}
                </button>
            </div>
        </div>
    );
}
