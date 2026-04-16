import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
    try {
        const { image, jsonData } = await req.json();

        if (!image && !jsonData) {
            return NextResponse.json({ error: "No image or data provided" }, { status: 400 });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // ── Native JSON Parsing (Nike+ / Strava) ────────────────────────
        if (jsonData) {
            try {
                // If the user sends a string, parse it
                const raw = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
                
                // Heuristic for Strava
                if (raw.distance && raw.moving_time) {
                    return NextResponse.json({
                        type: 'Run',
                        distance: raw.distance / 1609.34, // meters to miles
                        durationSeconds: raw.moving_time,
                        steps: raw.average_cadence ? (raw.average_cadence * raw.moving_time / 60) * 2 : null,
                        calories: raw.calories || null,
                        date: raw.start_date || null,
                        title: raw.name || "Strava Import"
                    });
                }

                // Heuristic for Nike+
                if (raw.summaries) {
                    const dist = raw.summaries.find((s: any) => s.metric === 'distance')?.value;
                    const dur = raw.summaries.find((s: any) => s.metric === 'duration')?.value / 1000;
                    return NextResponse.json({
                        type: 'Run',
                        distance: dist || 0,
                        durationSeconds: dur || 0,
                        calories: raw.summaries.find((s: any) => s.metric === 'calories')?.value || null,
                        date: raw.start_time || null,
                        title: "Nike+ Import"
                    });
                }
            } catch (e) {
                console.warn("Native JSON parse failed, falling back to LLM interpretation.");
            }
        }

        // Prompting OpenAI Vision to extract specific fields
        const response = await openai.chat.completions.create({
            model: "gpt-5.4-mini", // Upgraded to Global Standard GPT-5.4-mini
            messages: [
                {
                    role: "system",
                    content: `You are IQ Assistant's Vision Module. Your task is to extract athletic performance data from screenshots. 
                    You must return ONLY a JSON object with the following keys:
                    - type (String: 'Run', 'Walk', 'Bike', 'Hike')
                    - distance (Number: in miles)
                    - durationSeconds (Number: total time in seconds)
                    - steps (Number)
                    - calories (Number)
                    - pace (String: 'MM:SS')
                    - title (String: suggested title)
                    - date (String: ISO date if found, otherwise null)
                    - mileSplits (Array of Numbers: Seconds per mile if found)
                    
                    If a field is not found, return null for that field. 
                    Units: Always prioritize Miles. If Kilometers are found, convert to Miles.`
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: jsonData ? `Identify the activity data in this JSON text: ${JSON.stringify(jsonData)}` : "Scan this fitness activity summary and extract the data fields into the JSON format specified." },
                        ...(image ? [{
                            type: "image_url" as const,
                            image_url: { url: image }
                        }] : [])
                    ]
                }
            ],
            response_format: { type: "json_object" },
            max_completion_tokens: 1000,
        });

        const extractedData = JSON.parse(response.choices[0].message.content || "{}");
        return NextResponse.json(extractedData);

    } catch (error: any) {
        console.error("[SCAN_ACTIVITY_VISION]", error);
        return NextResponse.json({ error: error.message || "Failed to scan image" }, { status: 500 });
    }
}
