"use client";

import { useState } from "react";

interface ShareButtonProps {
    title: string;
    text: string;
    url?: string;
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
    const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

    const handleShare = async () => {
        const shareData = {
            title,
            text,
            url: url || window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                setStatus("idle");
            } catch (err) {
                console.error("Error sharing:", err);
                // User might have cancelled
            }
        } else {
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(`${text} ${shareData.url}`);
                setStatus("copied");
                setTimeout(() => setStatus("idle"), 2000);
            } catch (err) {
                console.error("Clipboard error:", err);
                setStatus("error");
            }
        }
    };

    return (
        <button
            onClick={handleShare}
            className="btn-primary"
            style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                fontSize: "14px",
                borderRadius: "var(--radius-full)"
            }}
        >
            <span>{status === "copied" ? "Copied!" : "Share Activity"}</span>
            <span style={{ fontSize: "16px" }}>📤</span>
        </button>
    );
}
