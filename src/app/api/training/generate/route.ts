import { OpenAI } from "openai";
import { NextResponse } from "next/server";

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

        // 1. Initial Call (Tool Check)
        const response1 = await openai.chat.completions.create({
            model: "gpt-4o", // Reverted to stable model
            messages: messages,
            tools: tools as any,
            tool_choice: "auto",
            response_format: { type: "json_object" },
            max_completion_tokens: 4096, // Increased token limit
        });

        const msg1 = response1.choices[0].message;

        // Handle Tool Call (Race Date Lookup)
        if (msg1.tool_calls) {
            const toolCall = msg1.tool_calls[0];

            // Reconstruct the message object correctly for the API
            const assistantMessage = {
                role: "assistant",
                content: msg1.content,
                tool_calls: msg1.tool_calls
            };

            // @ts-ignore
            if (toolCall.function.name === "tavily_search_race") {
                // @ts-ignore
                const args = JSON.parse(toolCall.function.arguments);
                const raceDateResult = await tavilySearch(args.query);

                messages.push(assistantMessage);
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: raceDateResult
                });

                // 2. Final Generation with Real Date
                const response2 = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: messages,
                    response_format: { type: "json_object" },
                    max_completion_tokens: 4096,
                });

                const finalContent = response2.choices[0].message.content;
                const plan = JSON.parse(finalContent || "{}");

                // Validate structure to prevent frontend crash
                if (!plan.weeks || !Array.isArray(plan.weeks)) {
                    throw new Error("Invalid plan structure generated");
                }

                return NextResponse.json(plan);
            }
        }

        // Direct Response (No Tool Used)
        const finalContent = msg1.content;
        const plan = JSON.parse(finalContent || "{}");
        if (!plan.weeks || !Array.isArray(plan.weeks)) {
            throw new Error("Invalid plan structure generated");
        }
        return NextResponse.json(plan);

    } catch (error: any) {
        console.error("Training Plan Error:", error);
        return NextResponse.json({ error: "Failed to generate plan." }, { status: 500 });
    }
}
