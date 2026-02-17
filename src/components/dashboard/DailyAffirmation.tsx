"use client";

import { useState, useEffect } from "react";

const quotes = [
    "Run the mile you are in.",
    "Your only competition is who you were yesterday.",
    "Pain is temporary. Pride is forever.",
    "Clear your mind, fill your lungs, find your rhythm.",
    "Every step is a victory."
];

export default function DailyAffirmation() {
    const [quote, setQuote] = useState("");

    useEffect(() => {
        // Simple random quote for MVP
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setQuote(randomQuote);
    }, []);

    return (
        <div className="glass-panel" style={{
            padding: "30px",
            borderRadius: "var(--radius-lg)",
            textAlign: "center",
            background: "linear-gradient(135deg, rgba(255, 0, 85, 0.1), rgba(0, 0, 0, 0))"
        }}>
            <h3 style={{ fontSize: "14px", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "15px" }}>
                Daily Mindset
            </h3>
            <p style={{ fontSize: "20px", fontStyle: "italic", fontFamily: "var(--font-heading)", lineHeight: 1.4 }}>
                "{quote}"
            </p>
        </div>
    );
}
