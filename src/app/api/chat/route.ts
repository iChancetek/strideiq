import { OpenAI } from "openai";
import { NextResponse } from "next/server";

// Initialize OpenAI Client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in Vercel/Netlify
});

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

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // Or gpt-5.2 if available/configured
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        const reply = completion.choices[0].message;
        return NextResponse.json({ message: reply });
    } catch (error) {
        console.error("OpenAI API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
