import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { trainingPlans, users } from "@/db/schema";
import { verifyFirebaseToken } from "@/lib/auth-utils";

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
        const auth = await verifyFirebaseToken();
        if (auth.error || !auth.userId) {
            return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status || 401 });
        }
        const userId = auth.userId;

        const { goal, raceName, timeline, level, daysPerWeek } = await req.json();

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: "OpenAI API Key missing" }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const systemPrompt = `You are StrideIQ's Elite Head Coach.
        Your task is to generate a structured, professional running training plan.
        - Analyze the user's goal, level, and schedule.
        - If a 'raceName' is provided, use the 'tavily_search_race' tool to find the exact date if you don't know it.
        - Generate a valid JSON response matching the schema provided.
        - Tone: Professional, expert, encouraging.
        - Structure: Array of weeks, each containing an array of workouts (Mon-Sun).
        - IMPORTANT: Return ONLY valid JSON.
        `;

        const userPrompt = `Create a ${timeline}-week training plan for a ${level} runner aiming to ${goal}.
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
                { "day": "Tuesday", "type": "Run", "distance": "3 miles", "description": "Easy run", "completed": false }
                ... (7 days)
              ]
            }
            ...
          ]
        }`;

        let messages: any[] = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ];

        // --- RETRY LOGIC (3 Attempts) ---
        let plan: any = null;
        let lastErr: any = null;

        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                // 1. Initial Call (Tool Check) with ELITE model
                let response1;
                try {
                    response1 = await openai.chat.completions.create({
                        model: "gpt-5.2",
                        messages: messages,
                        tools: tools as any,
                        tool_choice: "auto",
                        max_completion_tokens: 1500,
                    });
                } catch (modelErr) {
                    console.warn("[Training Plan] Elite model gpt-5.2 unavailable, falling back to gpt-5.4");
                    response1 = await openai.chat.completions.create({
                        model: "gpt-5.4",
                        messages: messages,
                        tools: tools as any,
                        tool_choice: "auto",
                        max_completion_tokens: 1500,
                    });
                }

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

                        let response2;
                        try {
                            response2 = await openai.chat.completions.create({
                                model: "gpt-5.2",
                                messages: messages,
                                response_format: { type: "json_object" },
                                max_completion_tokens: 3000,
                            });
                        } catch (e) {
                            console.warn("[Training Plan] Tool response fallback to gpt-5.4");
                            response2 = await openai.chat.completions.create({
                                model: "gpt-5.4",
                                messages: messages,
                                response_format: { type: "json_object" },
                                max_completion_tokens: 3000,
                            });
                        }

                        const finalContent = response2.choices[0].message.content || "{}";
                        plan = JSON.parse(finalContent);
                    }
                } else {
                    // Direct Response (No Tool Used)
                    let finalResponse;
                    try {
                        finalResponse = await openai.chat.completions.create({
                            model: "gpt-5.2",
                            messages: messages,
                            response_format: { type: "json_object" },
                            max_completion_tokens: 3000,
                        });
                    } catch (e) {
                        console.warn("[Training Plan] Direct response fallback to gpt-5.4");
                        finalResponse = await openai.chat.completions.create({
                            model: "gpt-5.4",
                            messages: messages,
                            response_format: { type: "json_object" },
                            max_completion_tokens: 3000,
                        });
                    }

                    const finalContent = finalResponse.choices[0].message.content || "{}";
                    plan = JSON.parse(finalContent);
                }

                if (plan && plan.weeks && Array.isArray(plan.weeks)) {
                    break; // Success!
                }
            } catch (e: any) {
                lastErr = e;
                console.warn(`[Training Plan] Attempt ${attempt + 1} failed:`, e?.message || e);
                if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
            }
        }

        if (!plan || !plan.weeks) {
            throw lastErr || new Error("Failed after 3 attempts");
        }

        // --- Save to Supabase ---
        await savePlanToPostgres(userId, plan);

        return NextResponse.json(plan);

    } catch (error: any) {
        console.error("Training Plan CRITICAL Error:", error);
        return NextResponse.json({ error: "Failed to generate plan: " + error.message }, { status: 500 });
    }
}

async function savePlanToPostgres(userId: string, plan: any) {
    try {
        console.log(`[Training] Saving plan to Postgres for user: ${userId}`);

        // Ensure user exists (Upsert)
        await db.insert(users).values({
            id: userId,
            email: "user@example.com", 
        }).onConflictDoNothing();

        // Save to training_plans
        const id = crypto.randomUUID();
        await db.insert(trainingPlans).values({
            id,
            userId,
            goal: plan.goal || "Generic Running",
            weeks: plan.weeks,
            startDate: new Date(),
            raceDate: plan.raceDate ? new Date(plan.raceDate) : new Date(Date.now() + 90 * 24 * 3600000), // Default 90 days out
            isActive: true,
        });

        console.log(`[Training] Plan saved successfully. ID: ${id}`);
    } catch (err) {
        console.error("[Training] Failed to save plan to Postgres:", err);
    }
}
