import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

let openai: OpenAI | null = null;
function getClient() {
    if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return openai;
}

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();
        if (!text || typeof text !== "string") {
            return NextResponse.json({ error: "Missing text" }, { status: 400 });
        }

        const client = getClient();
        const mp3 = await client.audio.speech.create({
            model: "tts-1",
            voice: "nova",      // Calm, warm, enthusiastic female voice
            input: text,
            speed: 1.05,        // Slightly upbeat
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "no-cache",
            },
        });
    } catch (error: any) {
        console.error("TTS error:", error);
        return NextResponse.json(
            { error: error.message || "TTS failed" },
            { status: 500 }
        );
    }
}
