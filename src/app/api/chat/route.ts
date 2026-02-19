import { NextResponse } from "next/server";
import OpenAI from "openai";
import { PERSONAS, PersonaId } from "@/lib/ai/personas";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [systemMessage, ...messages],
            temperature: 0.7,
            max_tokens: 500,
        });

        const reply = completion.choices[0].message;

        return NextResponse.json({ message: reply });
    } catch (error: any) {
        console.error("Error in chat route:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
