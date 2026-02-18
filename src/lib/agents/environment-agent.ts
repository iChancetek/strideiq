// StrideIQ Agentic AI — Environmental Awareness Agent
// Fetches weather at outdoor session start and produces contextual announcements.

import { AgentEvent, WeatherData } from "./types";

export class EnvironmentAgent {

    /**
     * Fetch weather for the given coordinates from our API route.
     */
    async fetchWeather(lat: number, lng: number): Promise<WeatherData | null> {
        try {
            const res = await fetch(`/api/weather?lat=${lat}&lon=${lng}`);
            if (!res.ok) return null;
            return (await res.json()) as WeatherData;
        } catch (err) {
            console.error("[EnvironmentAgent] Weather fetch failed:", err);
            return null;
        }
    }

    /**
     * Generate a weather announcement event.
     */
    generateAnnouncement(weather: WeatherData): AgentEvent {
        let message = `Current weather is ${Math.round(weather.temp)} degrees and ${weather.condition.toLowerCase()}`;

        if (weather.wind > 5) {
            message += ` with ${Math.round(weather.wind)} mile per hour winds`;
        } else {
            message += ` with light wind`;
        }
        message += ".";

        // Safety advisories
        const advisories: string[] = [];

        if (weather.temp >= 85) {
            advisories.push("It's hot out there — stay hydrated and pace yourself.");
        } else if (weather.temp >= 75) {
            advisories.push("Warm conditions. Remember to drink water.");
        } else if (weather.temp <= 35) {
            advisories.push("It's cold — make sure you're dressed warmly.");
        }

        const condLower = weather.condition.toLowerCase();
        if (condLower.includes("rain") || condLower.includes("drizzle")) {
            advisories.push("Rain detected. Watch your footing.");
        }
        if (condLower.includes("thunder") || condLower.includes("storm")) {
            advisories.push("Storms in the area. Consider an indoor workout.");
        }
        if (weather.wind > 20) {
            advisories.push("Strong winds today. Stay aware of your surroundings.");
        }

        if (advisories.length === 0) {
            message += " Excellent conditions for your session.";
        } else {
            message += " " + advisories.join(" ");
        }

        return {
            type: "weather:announcement",
            message,
            data: { weather },
            timestamp: Date.now(),
        };
    }
}
