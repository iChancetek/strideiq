import { NextResponse } from "next/server";
import OpenAI from "openai";
import { PERSONAS, PersonaId } from "@/lib/ai/personas";

// function to lazily initialize OpenAI client
function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set");
    }
    return new OpenAI({ apiKey });
}

async function tavilySearch(query: string, searchDepth: "basic" | "advanced" = "basic") {
    try {
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.TAVILY_API_KEY}`
            },
            body: JSON.stringify({
                query,
                search_depth: searchDepth,
                include_images: false,
                max_results: 5
            })
        });

        if (!response.ok) {
            console.error("Tavily API error", await response.text());
            return "Search failed";
        }

        const data = await response.json();
        // Return formatted results including URLs for the AI to embed in its response
        const results = data.results || [];
        return JSON.stringify(results.map((r: any) => ({
            title: r.title,
            url: r.url,
            content: r.content?.substring(0, 500)
        })));
    } catch (error) {
        console.error("Tavily fetch error:", error);
        return "Search error";
    }
}

const TOOLS = [
    {
        type: "function",
        function: {
            name: "tavily_search_web",
            description: "Search the web for general articles, studies, research, or information related to fitness, health, nutrition, and workouts. Use this whenever the user asks for articles, studies, tips, or recent news about any health or fitness topic.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The search query to find articles and information."
                    }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "tavily_search_youtube",
            description: "Search exclusively for YouTube videos demonstrating exercises, workout routines, form tutorials, or any fitness demonstration. Use this whenever the user asks for a video, demo, or visual example of any exercise or technique.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The exercise or topic to find a YouTube video for (e.g. 'proper deadlift form tutorial'). Do NOT append site:youtube.com, the system handles that."
                    }
                },
                required: ["query"]
            }
        }
    }
] as const;

export async function POST(req: Request) {
    try {
        const { messages, personaId } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
        }

        const validPersonaId = (personaId && PERSONAS[personaId as PersonaId]) ? (personaId as PersonaId) : "onyx";
        const persona = PERSONAS[validPersonaId];

        const systemMessage = {
            role: "system",
            content: persona.systemPrompt
        };

        const openai = getOpenAIClient();
        const fullMessages = [systemMessage, ...messages];

        // 1. Initial Call (Tool Check)
        console.log(`[Chat] Sending request for persona: ${validPersonaId}`);
        const response1 = await openai.chat.completions.create({
            model: "gpt-5.3",
            messages: fullMessages as any,
            tools: TOOLS as any,
            tool_choice: "auto",
            temperature: 0.7,
        });

        const msg1 = response1.choices[0].message;
        console.log(`[Chat] Tool calls requested: ${msg1.tool_calls?.length ?? 0}`);

        // 2. Handle Tool Calls (the missing for...of loop is now fixed)
        if (msg1.tool_calls && msg1.tool_calls.length > 0) {
            const assistantMessage = {
                role: "assistant",
                content: msg1.content || null,
                tool_calls: msg1.tool_calls
            };

            fullMessages.push(assistantMessage as any);

            // Process each tool call in parallel for speed
            const toolResults = await Promise.all(
                msg1.tool_calls.map(async (toolCall: any) => {
                    const toolName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);
                    let searchResult = "";

                    console.log(`[Chat] Executing tool: ${toolName} with query: "${args.query}"`);

                    if (toolName === "tavily_search_web") {
                        searchResult = await tavilySearch(args.query);
                    } else if (toolName === "tavily_search_youtube") {
                        searchResult = await tavilySearch(`${args.query} site:youtube.com`);
                    }

                    return {
                        role: "tool" as const,
                        tool_call_id: toolCall.id,
                        content: searchResult
                    };
                })
            );

            fullMessages.push(...toolResults as any);

            // 3. Final Generation with Search Context
            const response2 = await openai.chat.completions.create({
                model: "gpt-5.3",
                messages: fullMessages as any,
                temperature: 0.7,
            });

            console.log(`[Chat] Final response generated with search context.`);
            return NextResponse.json({ message: response2.choices[0].message });
        }

        // Direct Response (no tools needed)
        return NextResponse.json({ message: msg1 });

    } catch (error: any) {
        console.error("Error in chat route:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
