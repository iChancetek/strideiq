// Weather API Route — proxies requests to OpenWeatherMap
// Keeps API key server-side for security

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
        return NextResponse.json({ error: "lat and lon query params required" }, { status: 400 });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Weather API key not configured" }, { status: 500 });
    }

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
        const res = await fetch(url, { next: { revalidate: 300 } }); // Cache 5 min

        if (!res.ok) {
            console.error("[Weather API] OpenWeatherMap error:", res.status);
            return NextResponse.json({ error: "Weather service unavailable" }, { status: 502 });
        }

        const data = await res.json();

        // Simplify to our WeatherData shape
        const weather = {
            temp: Math.round(data.main.temp),
            condition: data.weather?.[0]?.description
                ? data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1)
                : "Unknown",
            humidity: data.main.humidity,
            wind: Math.round(data.wind?.speed || 0),
            icon: data.weather?.[0]?.icon || "01d",
        };

        return NextResponse.json(weather);
    } catch (error) {
        console.error("[Weather API] Fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch weather" }, { status: 500 });
    }
}
