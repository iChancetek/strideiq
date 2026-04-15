import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

const tools = [
    {
        type: "function",
        function: {
            name: "tavily_search_race",
            description: "Search for specific race date if user provides a race name.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The race name and year (e.g., 'Boston Marathon 2026 date').",
                    },
                },
                required: ["query"],
            },
        },
    },
];

async function tavilySearch(query: string) {
    try {
        const apiKey = process.env.TAVILY_API_KEY;
        if (!apiKey) throw new Error("Missing Tavily API Key");

        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                api_key: apiKey,
                query: query,
                search_depth: "basic",
                include_answer: true,
                max_results: 1
            }),
        });

        const data = await response.json();
        return JSON.stringify(data.answer || data.results?.[0]?.content || "Date not found.");
    } catch (error) {
        console.error("Tavily Search Error:", error);
        return "Error checking date.";
    }
}

export async function POST(req: Request) {
    try {
        const { goal, raceName, timeline, level, daysPerWeek, userId } = await req.json();

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: "OpenAI API Key missing" }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const systemPrompt = `You are StrideIQ's Elite Head Coach.
        Your task is to generate a structured, professional 7-day training plan.
        - Analyze the user's goal, level, and schedule.
        - If a 'raceName' is provided, use the 'tavily_search_race' tool to find the exact date if you don't know it.
        - Generate a valid JSON response matching the schema provided.
        - IMPORTANT: For each workout (except Rest), include a 'videoUrl' pointing to a relevant high-quality instructional YouTube video from reputable fitness channels.
        - Tone: Professional, expert, encouraging.
        - Structure: Array of weeks (usually 1 for current request), each containing an array of workouts (Mon-Sun).
        - IMPORTANT: Return ONLY valid JSON.
        `;

        const userPrompt = `Create a 1-week training plan for a ${level} runner aiming to ${goal}.
        Race: ${raceName || "None"}
        Frequency: ${daysPerWeek} days/week.
        Start Date: Today (${new Date().toISOString().split('T')[0]}).

        Return JSON format:
        {
          "goal": "${goal}",
          "raceDate": "YYYY-MM-DD",
          "weeks": [
            {
              "week": 1,
              "focus": "Base Building",
              "workouts": [
                { "day": "Monday", "type": "Rest", "description": "Rest day", "completed": false },
                { "day": "Tuesday", "type": "Run", "distance": "3 miles", "description": "Easy run", "completed": false, "videoUrl": "https://www.youtube.com/watch?v=..." }
                ... (7 days)
              ]
            }
          ]
        }`;

        let messages: any[] = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ];

        // 1. Initial Call (Tool Check)
        const response1 = await openai.chat.completions.create({
            model: "gpt-5.4-mini",
            messages: messages,
            tools: tools as any,
            tool_choice: "auto",
        });

        const msg1 = response1.choices[0].message;

        // Handle Tool Call (Race Date Lookup)
        if (msg1.tool_calls && msg1.tool_calls.length > 0) {
            const toolCall = msg1.tool_calls[0] as any;

            const assistantMessage = {
                role: "assistant",
                content: msg1.content || null,
                tool_calls: msg1.tool_calls
            };

            if (toolCall.function.name === "tavily_search_race") {
                const args = JSON.parse(toolCall.function.arguments);
                const raceDateResult = await tavilySearch(args.query);

                messages.push(assistantMessage);
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: raceDateResult
                });

                const response2 = await openai.chat.completions.create({
                    model: "gpt-5.4-mini",
                    messages: messages,
                    response_format: { type: "json_object" },
                });

                const finalContent = response2.choices[0].message.content || "{}";
                const plan = JSON.parse(finalContent);

                if (!plan.weeks || !Array.isArray(plan.weeks)) {
                    throw new Error("Invalid plan structure generated");
                }

                // ✅ Save via Admin SDK (bypasses Firestore rules)
                if (userId) {
                    await savePlanToFirestore(userId, plan);
                }

                return NextResponse.json(plan);
            }
        }

        // Direct Response (No Tool Used)
        const finalResponse = await openai.chat.completions.create({
            model: "gpt-5.4-mini",
            messages: messages,
            response_format: { type: "json_object" },
        });

        const finalContent = finalResponse.choices[0].message.content || "{}";
        const plan = JSON.parse(finalContent);

        if (!plan.weeks || !Array.isArray(plan.weeks)) {
            throw new Error("Invalid plan structure generated");
        }

        // ✅ Save via Admin SDK (bypasses Firestore rules)
        if (userId) {
            await savePlanToFirestore(userId, plan);
        }

        return NextResponse.json(plan);

    } catch (error: any) {
        console.error("Training Plan Error:", error);
        return NextResponse.json({ error: "Failed to generate plan." }, { status: 500 });
    }
}

/**
 * Saves the training plan to Firestore using the Admin SDK.
 * Writes to the top-level 'trainingPlans' collection (matches Firestore schema).
 * Non-fatal: we still return the plan to the user even if save fails.
 */
async function savePlanToFirestore(userId: string, plan: any) {
    try {
        console.log(`[Training] Saving plan for user: ${userId}`);

        // Ensure parent user doc exists
        await adminDb.collection("users").doc(userId).set({ uid: userId }, { merge: true });

        // Write to top-level 'trainingPlans' collection
        await adminDb.collection("trainingPlans").doc(userId).set({
            ...plan,
            userId,
            createdAt: Timestamp.now(),
            startDate: new Date().toISOString(),
        });

        console.log(`[Training] Plan saved successfully for user: ${userId}`);
    } catch (err) {
        console.error("[Training] Failed to save plan to Firestore:", err);
    }
}

