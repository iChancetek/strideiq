import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export const maxDuration = 60; // Allow longer generation times

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { type, duration } = await req.json();

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: "OpenAI API Key missing" }, { status: 500 });
        }

        // 1. Generate the Script
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an elite sports psychologist and meditation guide for high-performance runners. 
          Your goal is to create short, impactful visualization and breathing scripts.
          Tone: Calm, authoritative, inspiring, professional.
          Do NOT include stage directions like [Pause] or *Breathing*. Just write the spoken words.`
                },
                {
                    role: "user",
                    content: `Create a ${duration}-minute meditation script for a runner focusing on: ${type}.`
                }
            ],
        });

        const script = completion.choices[0].message.content;

        if (!script) {
            throw new Error("Failed to generate script");
        }

        // 2. Convert to Speech
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "onyx",
            input: script,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        // Return the audio file
        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": buffer.length.toString(),
            },
        });

    } catch (error) {
        console.error("Meditation generation error:", error);
        return NextResponse.json({ error: "Failed to generate session" }, { status: 500 });
    }
}
