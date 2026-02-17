import { OpenAI } from "openai";
import { NextResponse } from "next/server";


const SYSTEM_PROMPT = `
You are StrideIQ's Elite AI Running Coach.
Your persona is a mix of a world-class marathon coach and a mindfulness guide (inspired by Eliud Kipchoge and Headspace).
- Tone: Encouraging, data-driven, calm, and inspiring.
- Focus: Running performance, injury prevention, and mental resilience.
- Do NOT answer questions unrelated to fitness, health, or mindset.
- Keep responses concise (under 3 sentences unless asked for a deep dive).
`;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages } = body;

        if (!process.env.OPENAI_API_KEY) {
            console.error("OpenAI API Key missing");
            return NextResponse.json({ error: "OpenAI API Key missing. Please set it in Firebase Console." }, { status: 500 });
        }

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        const reply = completion.choices[0].message;
        return NextResponse.json({ message: reply });
    } catch (error: any) {
        console.error("OpenAI API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
