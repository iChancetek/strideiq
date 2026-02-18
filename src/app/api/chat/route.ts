import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `
You are StrideIQ's Elite AI Running Coach, "Onyx".
Your persona is a mix of a world-class marathon coach and a mindfulness guide (inspired by Eliud Kipchoge and Headspace).
- Tone: Encouraging, data-driven, calm, and inspiring.
- Focus: Running performance, injury prevention, and mental resilience.
- Capabilities: You have access to real-time information via the "tavily_search" tool. USE IT when asked about current events, weather, specific race dates, or latest shoe releases.
- If the user asks about their own data (pace, miles), answer based on the context provided (if any) or ask them clarify.
- Keep responses concise (under 3 sentences unless asked for a deep dive).
`;

const tools = [
    {
        type: "function",
        function: {
            name: "tavily_search",
            description: "Search the web for current information, race dates, weather, or running gear reviews.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The search query to send to Tavily.",
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
                max_results: 3
            }),
        });

        const data = await response.json();
        return JSON.stringify(data.results || data.answer || "No results found.");
    } catch (error) {
        console.error("Tavily Search Error:", error);
        return "Error performing search.";
    }
}

import { PERSONAS, PersonaId } from "@/lib/ai/personas";

// ... tools definition ... (keep existing tools)

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, personaId = "onyx" } = body;

        const selectedPersona = PERSONAS[personaId as PersonaId] || PERSONAS["onyx"];

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: "OpenAI API Key missing" }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const history = [
            { role: "system", content: selectedPersona.systemPrompt },
            ...messages
        ];

        // First call to model
        const response = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: history,
            tools: tools as any,
            tool_choice: "auto",
            max_completion_tokens: 500,
        });
        // ... rest of the file

        const responseMessage = response.choices[0].message;

        // Check if tool call is needed
        if (responseMessage.tool_calls) {
            const toolCall = responseMessage.tool_calls[0];
            // @ts-ignore
            const functionName = toolCall.function.name;
            // @ts-ignore
            const functionArgs = JSON.parse(toolCall.function.arguments);

            if (functionName === "tavily_search") {
                // Execute tool
                const toolResult = await tavilySearch(functionArgs.query);

                // Add tool result to history
                history.push(responseMessage);
                history.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: toolResult,
                });

                // Second call to model with tool result
                const finalResponse = await openai.chat.completions.create({
                    model: "gpt-5.2",
                    messages: history,
                    max_completion_tokens: 500,
                });

                return NextResponse.json({ message: finalResponse.choices[0].message });
            }
        }

        return NextResponse.json({ message: responseMessage });

    } catch (error: any) {
        console.error("Agent Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
